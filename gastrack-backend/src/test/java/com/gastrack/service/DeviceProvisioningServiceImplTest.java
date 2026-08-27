package com.gastrack.service;

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
import com.gastrack.service.impl.DeviceProvisioningServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.iot.IotClient;
import software.amazon.awssdk.services.iot.model.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeviceProvisioningServiceImpl Tests")
class DeviceProvisioningServiceImplTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private DeviceCredentialRepository deviceCredentialRepository;

    @Mock
    private IoTCoreClientFactory iotCoreClientFactory;

    @Mock
    private IoTCoreProperties iotProperties;

    @Mock
    private DeviceProvisioningProperties provisioningProperties;

    @Mock
    private IotClient iotClient;

    @InjectMocks
    private DeviceProvisioningServiceImpl service;

    private static final String SERIAL_NUMBER = "ESP32-SERIAL-001";
    private static final String CERT_ID = "cert-id-123";
    private static final String CERT_PEM = "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----";
    private static final String PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----";
    private static final String PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----";
    private static final String CERT_ARN = "arn:aws:iot:us-east-1:123456789:cert/cert-id-123";
    private static final String IOT_ENDPOINT = "xxx-ats.iot.us-east-1.amazonaws.com";
    private static final String POLICY_NAME = "gastrack-asp-policy";

    private Equipment esp32Equipment;

    @BeforeEach
    void setUp() {
        // Provisioning enabled by default; getCredentials tests never reach this check, hence lenient.
        lenient().when(provisioningProperties.isIotProvisioningEnabled()).thenReturn(true);

        EquipmentType esp32Type = EquipmentType.builder()
                .id(1L)
                .name("ESP32")
                .build();

        esp32Equipment = Equipment.builder()
                .id(100L)
                .serialNumber(SERIAL_NUMBER)
                .equipmentType(esp32Type)
                .active(true)
                .build();
    }

    @Nested
    @DisplayName("provisionInIoTCore")
    class ProvisionInIoTCore {

        @Test
        @DisplayName("should_ProvisionDevice_When_EquipmentHasSerialNumber")
        void should_ProvisionDevice_When_EquipmentHasSerialNumber() {
            // Given
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.empty());
            when(iotCoreClientFactory.createClient()).thenReturn(iotClient);

            CreateKeysAndCertificateResponse certResponse = CreateKeysAndCertificateResponse.builder()
                    .certificateId(CERT_ID)
                    .certificateArn(CERT_ARN)
                    .certificatePem(CERT_PEM)
                    .keyPair(KeyPair.builder().privateKey(PRIVATE_KEY).publicKey(PUBLIC_KEY).build())
                    .build();

            when(iotClient.createThing(any(CreateThingRequest.class)))
                    .thenReturn(CreateThingResponse.builder().build());
            when(iotClient.createKeysAndCertificate(any(CreateKeysAndCertificateRequest.class)))
                    .thenReturn(certResponse);
            when(iotClient.attachPolicy(any(AttachPolicyRequest.class)))
                    .thenReturn(AttachPolicyResponse.builder().build());
            when(iotClient.attachThingPrincipal(any(AttachThingPrincipalRequest.class)))
                    .thenReturn(AttachThingPrincipalResponse.builder().build());
            when(iotProperties.getPolicyName()).thenReturn(POLICY_NAME);
            when(iotClient.describeEndpoint(any(DescribeEndpointRequest.class)))
                    .thenReturn(DescribeEndpointResponse.builder().endpointAddress(IOT_ENDPOINT).build());
            when(deviceCredentialRepository.save(any(DeviceCredential.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            service.provisionInIoTCore(esp32Equipment);

            // Then
            verify(deviceCredentialRepository).save(any(DeviceCredential.class));
            verify(iotClient).createThing(any(CreateThingRequest.class));
            verify(iotClient).createKeysAndCertificate(any(CreateKeysAndCertificateRequest.class));
            verify(iotClient).attachPolicy(any(AttachPolicyRequest.class));
            verify(iotClient).attachThingPrincipal(any(AttachThingPrincipalRequest.class));
        }

        @Test
        @DisplayName("should_SkipProvisioning_When_AlreadyProvisioned")
        void should_SkipProvisioning_When_AlreadyProvisioned() {
            // Given
            DeviceCredential existing = DeviceCredential.builder().id(1L).build();
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.of(existing));

            // When
            service.provisionInIoTCore(esp32Equipment);

            // Then
            verify(iotCoreClientFactory, never()).createClient();
            verify(deviceCredentialRepository, never()).save(any());
        }

        @Test
        @DisplayName("should_SkipProvisioning_When_NoSerialNumber")
        void should_SkipProvisioning_When_NoSerialNumber() {
            // Given
            Equipment noSerial = Equipment.builder()
                    .id(200L)
                    .serialNumber(null)
                    .active(true)
                    .build();

            // When
            service.provisionInIoTCore(noSerial);

            // Then
            verifyNoInteractions(deviceCredentialRepository);
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_SkipProvisioning_When_BlankSerialNumber")
        void should_SkipProvisioning_When_BlankSerialNumber() {
            // Given
            Equipment blankSerial = Equipment.builder()
                    .id(200L)
                    .serialNumber("   ")
                    .active(true)
                    .build();

            // When
            service.provisionInIoTCore(blankSerial);

            // Then
            verifyNoInteractions(deviceCredentialRepository);
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_ThrowBusinessException_When_IoTCoreApiError")
        void should_ThrowBusinessException_When_IoTCoreApiError() {
            // Given
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.empty());
            when(iotCoreClientFactory.createClient()).thenReturn(iotClient);
            when(iotClient.createThing(any(CreateThingRequest.class)))
                    .thenThrow(IotException.builder().message("Throttling").build());

            // When/Then
            assertThatThrownBy(() -> service.provisionInIoTCore(esp32Equipment))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("IoT Core provisioning failed");
        }

        @Test
        @DisplayName("should_SkipProvisioning_When_ProvisioningDisabled")
        void should_SkipProvisioning_When_ProvisioningDisabled() {
            // Given
            when(provisioningProperties.isIotProvisioningEnabled()).thenReturn(false);

            // When
            service.provisionInIoTCore(esp32Equipment);

            // Then
            verifyNoInteractions(deviceCredentialRepository);
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_ReclaimOrphanCredential_When_CredentialBelongsToFormerEsp32")
        void should_ReclaimOrphanCredential_When_CredentialBelongsToFormerEsp32() {
            // Given: credential with this thing_name exists but its owner is no longer an ESP32
            EquipmentType sensorType = EquipmentType.builder().id(2L).name("Sensor").build();
            Equipment formerOwner = Equipment.builder()
                    .id(999L)
                    .serialNumber(null)
                    .equipmentType(sensorType)
                    .active(true)
                    .build();
            DeviceCredential orphan = DeviceCredential.builder()
                    .id(7L)
                    .equipment(formerOwner)
                    .thingName(SERIAL_NUMBER)
                    .build();

            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.empty());
            when(deviceCredentialRepository.findByThingName(SERIAL_NUMBER)).thenReturn(Optional.of(orphan));
            when(deviceCredentialRepository.save(any(DeviceCredential.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            service.provisionInIoTCore(esp32Equipment);

            // Then: credential reassigned to the new equipment, no IoT Core calls
            assertThat(orphan.getEquipment()).isSameAs(esp32Equipment);
            verify(deviceCredentialRepository).save(orphan);
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_SwallowSdkClientException_When_AwsCredentialsMissing")
        void should_SwallowSdkClientException_When_AwsCredentialsMissing() {
            // Given
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.empty());
            when(deviceCredentialRepository.findByThingName(SERIAL_NUMBER)).thenReturn(Optional.empty());
            when(iotCoreClientFactory.createClient()).thenReturn(iotClient);
            when(iotClient.createThing(any(CreateThingRequest.class)))
                    .thenThrow(SdkClientException.builder().message("Unable to load credentials").build());

            // When: no exception should escape (dev/local environments)
            service.provisionInIoTCore(esp32Equipment);

            // Then: equipment registration flow keeps working, no credential persisted
            verify(deviceCredentialRepository, never()).save(any(DeviceCredential.class));
        }
    }

    @Nested
    @DisplayName("deactivateCredential / revokeCredential")
    class DeactivateAndRevoke {

        private DeviceCredential activeCredential() {
            return DeviceCredential.builder()
                    .id(1L)
                    .equipment(esp32Equipment)
                    .thingName(SERIAL_NUMBER)
                    .certificateId(CERT_ID)
                    .active(true)
                    .build();
        }

        @Test
        @DisplayName("should_FlipLocalFlagOnly_When_Deactivate")
        void should_FlipLocalFlagOnly_When_Deactivate() {
            DeviceCredential credential = activeCredential();
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.of(credential));

            service.deactivateCredential(esp32Equipment);

            assertThat(credential.getActive()).isFalse();
            verify(deviceCredentialRepository).save(credential);
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_NoOp_When_DeactivateWithoutCredential")
        void should_NoOp_When_DeactivateWithoutCredential() {
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.empty());

            service.deactivateCredential(esp32Equipment);

            verify(deviceCredentialRepository, never()).save(any());
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_RevokeCertificateAndDeactivate_When_Revoke")
        void should_RevokeCertificateAndDeactivate_When_Revoke() {
            DeviceCredential credential = activeCredential();
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.of(credential));
            when(iotCoreClientFactory.createClient()).thenReturn(iotClient);
            when(iotClient.updateCertificate(any(UpdateCertificateRequest.class)))
                    .thenReturn(UpdateCertificateResponse.builder().build());

            service.revokeCredential(esp32Equipment);

            assertThat(credential.getActive()).isFalse();
            verify(deviceCredentialRepository).save(credential);
            verify(iotClient).updateCertificate(argThat((UpdateCertificateRequest r) ->
                    CERT_ID.equals(r.certificateId()) && r.newStatus() == CertificateStatus.REVOKED));
        }

        @Test
        @DisplayName("should_SwallowSdkClientException_When_RevokeWithoutAwsCreds")
        void should_SwallowSdkClientException_When_RevokeWithoutAwsCreds() {
            DeviceCredential credential = activeCredential();
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.of(credential));
            when(iotCoreClientFactory.createClient()).thenReturn(iotClient);
            when(iotClient.updateCertificate(any(UpdateCertificateRequest.class)))
                    .thenThrow(SdkClientException.builder().message("Unable to load credentials").build());

            // No exception escapes; local flag already flipped and persisted.
            service.revokeCredential(esp32Equipment);

            assertThat(credential.getActive()).isFalse();
            verify(deviceCredentialRepository).save(credential);
        }

        @Test
        @DisplayName("should_SwallowIotException_When_CertAlreadyRevoked")
        void should_SwallowIotException_When_CertAlreadyRevoked() {
            DeviceCredential credential = activeCredential();
            when(deviceCredentialRepository.findByEquipmentId(100L)).thenReturn(Optional.of(credential));
            when(iotCoreClientFactory.createClient()).thenReturn(iotClient);
            // IoT recusa revogar um cert já REVOKED (HTTP 406) — best-effort, não deve estourar
            // e derrubar a operação (ex.: swap/aposentar).
            when(iotClient.updateCertificate(any(UpdateCertificateRequest.class)))
                    .thenThrow(IotException.builder().message("Not allowed to update from REVOKED status").build());

            service.revokeCredential(esp32Equipment);

            assertThat(credential.getActive()).isFalse();
            verify(deviceCredentialRepository).save(credential);
        }
    }

    @Nested
    @DisplayName("getCredentials")
    class GetCredentials {

        @Test
        @DisplayName("should_ReturnCredentials_When_Provisioned")
        void should_ReturnCredentials_When_Provisioned() {
            // Given
            when(equipmentRepository.findActiveBySerialNumber(SERIAL_NUMBER))
                    .thenReturn(List.of(esp32Equipment));

            DeviceCredential credential = DeviceCredential.builder()
                    .id(1L)
                    .equipment(esp32Equipment)
                    .thingName(SERIAL_NUMBER)
                    .certificateId(CERT_ID)
                    .certificatePem(CERT_PEM)
                    .privateKey(PRIVATE_KEY)
                    .publicKey(PUBLIC_KEY)
                    .iotEndpoint(IOT_ENDPOINT)
                    .active(true)
                    .build();

            when(deviceCredentialRepository.findByEquipmentId(100L))
                    .thenReturn(Optional.of(credential));

            // When
            DeviceProvisioningResponse response = service.getCredentials(SERIAL_NUMBER);

            // Then
            assertThat(response.getThingName()).isEqualTo(SERIAL_NUMBER);
            assertThat(response.getCertificatePem()).isEqualTo(CERT_PEM);
            assertThat(response.getPrivateKey()).isEqualTo(PRIVATE_KEY);
            assertThat(response.getPublicKey()).isEqualTo(PUBLIC_KEY);
            assertThat(response.getIotEndpoint()).isEqualTo(IOT_ENDPOINT);
            assertThat(response.isAlreadyProvisioned()).isTrue();

            // Should NOT call IoT Core
            verifyNoInteractions(iotCoreClientFactory);
        }

        @Test
        @DisplayName("should_ThrowResourceNotFound_When_EquipmentNotFound")
        void should_ThrowResourceNotFound_When_EquipmentNotFound() {
            // Given
            when(equipmentRepository.findActiveBySerialNumber("NONEXISTENT"))
                    .thenReturn(List.of());

            // When/Then
            assertThatThrownBy(() -> service.getCredentials("NONEXISTENT"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Equipment");
        }

        @Test
        @DisplayName("should_ThrowBusinessException_When_EquipmentNotEsp32Type")
        void should_ThrowBusinessException_When_EquipmentNotAspType() {
            // Given
            EquipmentType sensorType = EquipmentType.builder().id(2L).name("Sensor").build();
            Equipment sensorEquipment = Equipment.builder()
                    .id(200L)
                    .serialNumber(SERIAL_NUMBER)
                    .equipmentType(sensorType)
                    .active(true)
                    .build();

            when(equipmentRepository.findActiveBySerialNumber(SERIAL_NUMBER))
                    .thenReturn(List.of(sensorEquipment));

            // When/Then
            assertThatThrownBy(() -> service.getCredentials(SERIAL_NUMBER))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not of type ESP32");
        }

        @Test
        @DisplayName("should_ThrowResourceNotFound_When_NotProvisioned")
        void should_ThrowResourceNotFound_When_NotProvisioned() {
            // Given
            when(equipmentRepository.findActiveBySerialNumber(SERIAL_NUMBER))
                    .thenReturn(List.of(esp32Equipment));
            when(deviceCredentialRepository.findByEquipmentId(100L))
                    .thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> service.getCredentials(SERIAL_NUMBER))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("DeviceCredential");
        }
    }
}
