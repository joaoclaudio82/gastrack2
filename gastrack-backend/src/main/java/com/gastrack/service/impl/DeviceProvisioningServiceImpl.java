package com.gastrack.service.impl;

import com.gastrack.components.IoTCoreClientFactory;
import com.gastrack.configuration.DeviceProvisioningProperties;
import com.gastrack.configuration.IoTCoreProperties;
import com.gastrack.dto.device.DeviceProvisioningResponse;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.model.DeviceCredential;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.DeviceCredentialRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.service.DeviceProvisioningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.iot.IotClient;
import software.amazon.awssdk.services.iot.model.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceProvisioningServiceImpl implements DeviceProvisioningService {

    private static final String ESP32_TYPE_NAME = EquipmentType.ESP32_TYPE_NAME;

    private final EquipmentRepository equipmentRepository;
    private final DeviceCredentialRepository deviceCredentialRepository;
    private final IoTCoreClientFactory iotCoreClientFactory;
    private final IoTCoreProperties iotProperties;
    private final DeviceProvisioningProperties provisioningProperties;

    @Override
    @Transactional
    public void provisionInIoTCore(Equipment equipment) {
        log.info("Auto-provisioning IoT for equipment: {} (serial: {})", equipment.getId(), equipment.getSerialNumber());

        if (!provisioningProperties.isIotProvisioningEnabled()) {
            log.info("IoT provisioning disabled (device.provisioning.iot-provisioning-enabled=false); "
                    + "skipping for equipment {}", equipment.getId());
            return;
        }

        if (equipment.getSerialNumber() == null || equipment.getSerialNumber().isBlank()) {
            log.warn("Skipping IoT provisioning - equipment {} has no serial number", equipment.getId());
            return;
        }

        // Idempotent: skip if already provisioned
        if (deviceCredentialRepository.findByEquipmentId(equipment.getId()).isPresent()) {
            log.info("Equipment {} already provisioned in IoT Core, skipping", equipment.getId());
            return;
        }

        String thingName = equipment.getSerialNumber();

        // Check if another equipment already holds a credential with this thing_name.
        // Orphan case: the owning equipment is no longer an active ESP32 with this serial
        // (e.g. type was changed away from ESP32 leaving the credential behind).
        // In that case we reclaim the orphan credential instead of re-provisioning in IoT Core,
        // since the Thing and certificate already exist and are valid.
        Optional<DeviceCredential> existingByThingName = deviceCredentialRepository.findByThingName(thingName);
        if (existingByThingName.isPresent()) {
            DeviceCredential orphan = existingByThingName.get();
            Equipment owner = orphan.getEquipment();
            boolean isOrphan = !owner.getId().equals(equipment.getId())
                    && (!ESP32_TYPE_NAME.equalsIgnoreCase(owner.getEquipmentType().getName())
                        || !thingName.equals(owner.getSerialNumber())
                        || Boolean.FALSE.equals(owner.getActive()));
            if (isOrphan) {
                orphan.setEquipment(equipment);
                deviceCredentialRepository.save(orphan);
                log.info("Reclaimed orphan credential {} for equipment {} (thing: {})",
                        orphan.getId(), equipment.getId(), thingName);
                return;
            }
            throw new BusinessException(
                    "Serial number '" + thingName + "' is already provisioned in IoT Core for equipment ID "
                            + owner.getId());
        }

        try (IotClient iotClient = iotCoreClientFactory.createClient()) {
            createThing(iotClient, thingName);
            CreateKeysAndCertificateResponse certResponse = createKeysAndCertificate(iotClient);
            attachPolicy(iotClient, certResponse.certificateArn());
            attachThingPrincipal(iotClient, thingName, certResponse.certificateArn());
            String endpoint = resolveEndpoint(iotClient);

            DeviceCredential credential = DeviceCredential.builder()
                    .equipment(equipment)
                    .thingName(thingName)
                    .certificateId(certResponse.certificateId())
                    .certificatePem(certResponse.certificatePem())
                    .privateKey(certResponse.keyPair().privateKey())
                    .publicKey(certResponse.keyPair().publicKey())
                    .iotEndpoint(endpoint)
                    .active(true)
                    .build();

            deviceCredentialRepository.save(credential);
            log.info("IoT provisioning completed for equipment {} (thing: {})", equipment.getId(), thingName);

        } catch (IotException e) {
            log.error("IoT Core error during provisioning for equipment {}: {}", equipment.getId(), e.getMessage());
            throw new BusinessException("IoT Core provisioning failed: " + e.getMessage(), e);
        } catch (SdkClientException e) {
            // Local/dev environments may not have IAM credentials. Keep equipment registration flow working.
            log.warn("Skipping IoT provisioning for equipment {} due to missing AWS credentials/network: {}",
                    equipment.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deactivateCredential(Equipment equipment) {
        deviceCredentialRepository.findByEquipmentId(equipment.getId()).ifPresent(credential -> {
            credential.setActive(false);
            deviceCredentialRepository.save(credential);
            log.info("Deactivated IoT credential for equipment {} (thing: {})",
                    equipment.getId(), credential.getThingName());
        });
    }

    @Override
    @Transactional
    public void revokeCredential(Equipment equipment) {
        deviceCredentialRepository.findByEquipmentId(equipment.getId()).ifPresent(credential -> {
            credential.setActive(false);
            deviceCredentialRepository.save(credential);

            try (IotClient iotClient = iotCoreClientFactory.createClient()) {
                iotClient.updateCertificate(UpdateCertificateRequest.builder()
                        .certificateId(credential.getCertificateId())
                        .newStatus(CertificateStatus.REVOKED)
                        .build());
                log.info("Revoked IoT certificate {} for equipment {} (thing: {})",
                        credential.getCertificateId(), equipment.getId(), credential.getThingName());
            } catch (IotException e) {
                // Best-effort: a flag local já foi desativada. Não derruba a operação de negócio
                // (ex.: swap/aposentar) por um erro no IoT — inclui o caso idempotente de o
                // certificado já estar REVOKED (HTTP 406), que é o estado desejado.
                log.warn("Skipping IoT certificate revoke for equipment {} (already revoked or IoT error): {}",
                        equipment.getId(), e.getMessage());
            } catch (SdkClientException e) {
                // Local/dev without AWS credentials: local flag is already flipped, keep flow working.
                log.warn("Skipping IoT certificate revoke for equipment {} due to missing AWS credentials/network: {}",
                        equipment.getId(), e.getMessage());
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public DeviceProvisioningResponse getCredentials(String serialNumber) {
        log.info("Retrieving IoT credentials for serial: {}", serialNumber);

        Equipment equipment = findEquipment(serialNumber);

        DeviceCredential credential = deviceCredentialRepository.findByEquipmentId(equipment.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "DeviceCredential", "serialNumber", serialNumber));

        return DeviceProvisioningResponse.builder()
                .thingName(credential.getThingName())
                .certificatePem(credential.getCertificatePem())
                .privateKey(credential.getPrivateKey())
                .publicKey(credential.getPublicKey())
                .iotEndpoint(credential.getIotEndpoint())
                .alreadyProvisioned(true)
                .build();
    }

    private Equipment findEquipment(String serialNumber) {
        List<Equipment> equipments = equipmentRepository.findActiveBySerialNumber(serialNumber);

        if (equipments.isEmpty()) {
            throw new ResourceNotFoundException("Equipment", "serialNumber", serialNumber);
        }

        return equipments.stream()
                .filter(e -> ESP32_TYPE_NAME.equalsIgnoreCase(e.getEquipmentType().getName()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "Equipment with serial '" + serialNumber + "' is not of type ESP32"));
    }

    private void createThing(IotClient iotClient, String thingName) {
        CreateThingRequest request = CreateThingRequest.builder()
                .thingName(thingName)
                .build();
        iotClient.createThing(request);
        log.debug("Created IoT Thing: {}", thingName);
    }

    private CreateKeysAndCertificateResponse createKeysAndCertificate(IotClient iotClient) {
        CreateKeysAndCertificateRequest request = CreateKeysAndCertificateRequest.builder()
                .setAsActive(true)
                .build();
        return iotClient.createKeysAndCertificate(request);
    }

    private void attachPolicy(IotClient iotClient, String certificateArn) {
        AttachPolicyRequest request = AttachPolicyRequest.builder()
                .policyName(iotProperties.getPolicyName())
                .target(certificateArn)
                .build();
        iotClient.attachPolicy(request);
    }

    private void attachThingPrincipal(IotClient iotClient, String thingName, String certificateArn) {
        AttachThingPrincipalRequest request = AttachThingPrincipalRequest.builder()
                .thingName(thingName)
                .principal(certificateArn)
                .build();
        iotClient.attachThingPrincipal(request);
    }

    private String resolveEndpoint(IotClient iotClient) {
        DescribeEndpointRequest request = DescribeEndpointRequest.builder()
                .endpointType("iot:Data-ATS")
                .build();
        return iotClient.describeEndpoint(request).endpointAddress();
    }
}
