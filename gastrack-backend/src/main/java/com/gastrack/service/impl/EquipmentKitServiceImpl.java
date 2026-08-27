package com.gastrack.service.impl;

import com.gastrack.dto.equipmentkit.EquipmentKitRequest;
import com.gastrack.dto.equipmentkit.EquipmentKitResponse;
import com.gastrack.dto.equipmentkit.EquipmentKitStatusUpdateRequest;
import com.gastrack.dto.equipmentkit.KitCylinderView;
import com.gastrack.dto.equipmentkit.SwapEspRequest;
import com.gastrack.dto.equipmentkit.SwapSensorRequest;
import com.gastrack.dto.kitinstallation.KitInstallRequest;
import com.gastrack.dto.kitinstallation.KitUninstallRequest;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.EquipmentKitMapper;
import com.gastrack.model.*;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.KitInstallationRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.DeviceProvisioningService;
import com.gastrack.service.EquipmentKitService;
import com.gastrack.service.MovementHistoryService;
import com.gastrack.service.TenantSecurityService;
import com.gastrack.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentKitServiceImpl implements EquipmentKitService {

    private final EquipmentKitRepository equipmentKitRepository;
    private final EquipmentRepository equipmentRepository;
    private final ContractRepository contractRepository;
    private final AddressRepository addressRepository;
    private final KitInstallationRepository kitInstallationRepository;
    private final CylinderRepository cylinderRepository;
    private final EquipmentKitMapper equipmentKitMapper;
    private final TenantSecurityService tenantSecurityService;
    private final UserService userService;
    private final MovementHistoryService movementHistoryService;
    private final DeviceProvisioningService deviceProvisioningService;

    private User getCurrentUser() {
        Long currentUserId = TenantContext.getCurrentUserId();
        return currentUserId != null ? userService.findById(currentUserId) : null;
    }

    @Override
    @Transactional
    public EquipmentKitResponse create(EquipmentKitRequest request) {
        log.info("Creating equipment kit: {} for contract: {}", request.kitCode(), request.contractId());

        Contract contract = contractRepository.findById(request.contractId())
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", request.contractId()));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        Address address = null;
        if (request.addressId() != null) {
            address = addressRepository.findById(request.addressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.addressId()));
            validateAddressForContract(address, contract);
        }

        if (equipmentKitRepository.existsByKitCode(request.kitCode())) {
            throw new ConflictException("Equipment kit with this kit code already exists");
        }

        // Validate contract is active
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new BusinessException("Contract must be ACTIVE to add kits");
        }

        // Validate kit quantity limit
        long activeKits = equipmentKitRepository.countActiveByContractId(contract.getId());
        if (activeKits >= contract.getKitQuantity()) {
            throw new BusinessException(
                "Contract has reached its maximum number of kits (" + contract.getKitQuantity() + ")"
            );
        }

        // Validate installation date within contract validity period
        if (request.installationDate() != null) {
            if (request.installationDate().isBefore(contract.getStartDate())) {
                throw new BusinessException("Installation date cannot be before contract start date");
            }
            if (contract.getEndDate() != null && request.installationDate().isAfter(contract.getEndDate())) {
                throw new BusinessException("Installation date cannot be after contract end date");
            }
        }

        EquipmentKit kit = equipmentKitMapper.toEntity(request);
        kit.setContract(contract);
        kit.setAddress(address);

        // Set created by if user is logged in
        Long currentUserId = TenantContext.getCurrentUserId();
        if (currentUserId != null) {
            User currentUser = userService.findById(currentUserId);
            kit.setCreatedBy(currentUser);
        }

        EquipmentKit saved = equipmentKitRepository.save(kit);

        // Record history
        movementHistoryService.recordKitCreated(saved, getCurrentUser());

        log.info("Equipment kit created successfully with id: {}", saved.getId());
        return equipmentKitMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentKitResponse findById(Long id) {
        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // Validate access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        // Detail only: enrich with cylinders installed on the kit's gas points (avoids N+1 on listing)
        return equipmentKitMapper.toResponse(kit).withCylinders(collectCylinders(kit));
    }

    /**
     * kit -> active sensor equipments (which carry a pontoGas) -> deduped points -> active cylinders.
     * The pressure reading (currentPressureBar/status) is read from the point, not the cylinder.
     */
    private List<KitCylinderView> collectCylinders(EquipmentKit kit) {
        if (kit.getEquipments() == null) {
            return List.of();
        }

        // Dedup points by id, keeping the point entity for its reading fields.
        Map<Long, PontoGas> points = new LinkedHashMap<>();
        for (Equipment equipment : kit.getEquipments()) {
            if (!Boolean.TRUE.equals(equipment.getActive())) {
                continue;
            }
            PontoGas point = equipment.getPontoGas();
            if (point != null) {
                points.putIfAbsent(point.getId(), point);
            }
        }

        List<KitCylinderView> views = new ArrayList<>();
        for (PontoGas point : points.values()) {
            for (Cylinder cylinder : cylinderRepository.findByPontoGasIdAndActiveTrue(point.getId())) {
                views.add(new KitCylinderView(
                    cylinder.getId(),
                    cylinder.getSerialNumber(),
                    cylinder.getCylinderModel() != null ? cylinder.getCylinderModel().getGasType() : null,
                    point.getId(),
                    point.getLocation(),
                    point.getCurrentPressureBar(),
                    point.getStatus()
                ));
            }
        }
        return views;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentKitResponse> findAll(Pageable pageable, KitStatus status, Long contractId) {
        Long companyId = null;
        if (!TenantContext.isSuperAdmin()) {
            companyId = tenantSecurityService.requireCompanyContext();
        }

        Page<EquipmentKit> kits = equipmentKitRepository.search(companyId, contractId, status, pageable);
        return kits.map(equipmentKitMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentKitResponse> findByContract(Long contractId, Pageable pageable) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", contractId));

        // Validate access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(contract.getCompany().getId());
        }

        return equipmentKitRepository.findByContractIdAndActive(contractId, true, pageable)
            .map(equipmentKitMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentKitResponse> findByCompanyAndStatus(Long companyId, KitStatus status, Pageable pageable) {
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(companyId);
        }

        return equipmentKitRepository.findByCompanyIdAndStatus(companyId, status, pageable)
            .map(equipmentKitMapper::toResponse);
    }

    @Override
    @Transactional
    public EquipmentKitResponse update(Long id, EquipmentKitRequest request) {
        log.info("Updating equipment kit with id: {}", id);

        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        Contract contract = contractRepository.findById(request.contractId())
            .orElseThrow(() -> new ResourceNotFoundException("Contract", "id", request.contractId()));

        // Security: block moving a kit to a contract of a DIFFERENT company (retroactive tenant leak).
        // Changing address/contract within the SAME company stays allowed; cross-company must go through
        // remove + reinstall (so reading isolation by ownership window applies).
        Company currentCompany = kit.getCompany();
        if (currentCompany != null
            && !Objects.equals(currentCompany.getId(), contract.getCompany().getId())) {
            throw new BusinessException(
                "cross-company move nao permitido; use remover + reinstalar");
        }

        Address address = null;
        if (request.addressId() != null) {
            address = addressRepository.findById(request.addressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.addressId()));
            validateAddressForContract(address, contract);
        }

        // Validate installation date within contract validity period
        if (request.installationDate() != null) {
            if (request.installationDate().isBefore(contract.getStartDate())) {
                throw new BusinessException("Installation date cannot be before contract start date");
            }
            if (contract.getEndDate() != null && request.installationDate().isAfter(contract.getEndDate())) {
                throw new BusinessException("Installation date cannot be after contract end date");
            }
        }

        // Check if new kit code conflicts with another kit
        if (!kit.getKitCode().equals(request.kitCode())) {
            equipmentKitRepository.findByKitCode(request.kitCode())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new ConflictException("Equipment kit with this kit code already exists");
                    }
                });
        }

        equipmentKitMapper.updateEntity(request, kit);
        kit.setContract(contract);
        kit.setAddress(address);
        EquipmentKit saved = equipmentKitRepository.save(kit);

        log.info("Equipment kit updated successfully with id: {}", saved.getId());
        return equipmentKitMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentKitResponse updateStatus(Long id, EquipmentKitStatusUpdateRequest request) {
        log.info("Updating status for equipment kit with id: {} to {}", id, request.status());

        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        KitStatus oldStatus = kit.getStatus();

        // Enforce the state machine (KitStatus.getAllowedTransitions). No-op self-updates are allowed.
        if (oldStatus != request.status() && !oldStatus.getAllowedTransitions().contains(request.status())) {
            throw new BusinessException(
                "Cannot transition kit from " + oldStatus + " to " + request.status()
            );
        }

        kit.setStatus(request.status());

        // On REMOVED, deactivate/park the ESP32 credentials (device stays reusable in stock).
        // Run before unassigning so the kit's ESP32 equipments are still reachable. Revoke is
        // NOT here: it happens on equipment deactivation (device leaving the fleet).
        if (request.status() == KitStatus.REMOVED) {
            handleCredentialsOnRemoval(kit);
        }

        // If kit is being REMOVED, unassign all equipment
        if (request.status() == KitStatus.REMOVED) {
            unassignAllEquipment(kit);
        }

        EquipmentKit saved = equipmentKitRepository.save(kit);

        // Record history
        movementHistoryService.recordKitStatusChanged(saved, oldStatus, request.status(), getCurrentUser());

        log.info("Equipment kit status updated successfully with id: {}", saved.getId());
        return equipmentKitMapper.toResponse(saved);
    }

    /**
     * On kit removal, deactivate (park) the IoT credential of each active ESP32 in the kit — the
     * device goes back to stock, reusable. Revoking (device leaves the fleet) is not a kit concern:
     * it happens when the equipment itself is deactivated/retired ({@code EquipmentService.deactivate}).
     * Sensors have no credential and are skipped.
     */
    private void handleCredentialsOnRemoval(EquipmentKit kit) {
        if (kit.getEquipments() == null) {
            return;
        }
        for (Equipment equipment : kit.getEquipments()) {
            if (!Boolean.TRUE.equals(equipment.getActive())) {
                continue;
            }
            EquipmentType type = equipment.getEquipmentType();
            if (type == null || !EquipmentType.ESP32_TYPE_NAME.equalsIgnoreCase(type.getName())) {
                continue;
            }
            deviceProvisioningService.deactivateCredential(equipment);
        }
    }

    private void unassignAllEquipment(EquipmentKit kit) {
        if (kit.getEquipments() == null || kit.getEquipments().isEmpty()) {
            return;
        }

        User currentUser = getCurrentUser();
        for (Equipment equipment : kit.getEquipments()) {
            if (Boolean.TRUE.equals(equipment.getActive())) {
                movementHistoryService.recordEquipmentRemovedFromKit(equipment, kit, currentUser);
                equipment.setEquipmentKit(null);
            }
        }
        log.info("Unassigned {} equipment(s) from kit {}", kit.getEquipments().size(), kit.getId());
    }

    @Override
    @Transactional
    public EquipmentKitResponse installKit(Long id, KitInstallRequest request) {
        log.info("Installing equipment kit with id: {} at address: {}", id, request.addressId());

        // 1. Fetch kit
        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // 2. Validate kit is active
        if (!Boolean.TRUE.equals(kit.getActive())) {
            throw new BusinessException("Cannot install inactive kit");
        }

        // 3. Validate state machine - can only install from PENDING or REMOVED
        if (!kit.getStatus().canInstall()) {
            throw new BusinessException("Kit status " + kit.getStatus() + " cannot be installed");
        }

        // 4. Validate contract is active
        Contract contract = kit.getContract();
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new BusinessException("Contract must be ACTIVE to install kit");
        }

        // 5. Validate contract not expired
        if (contract.getEndDate() != null && contract.getEndDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Contract has expired");
        }

        // 6. Fetch and validate address
        Address address = addressRepository.findById(request.addressId())
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.addressId()));

        if (!Boolean.TRUE.equals(address.getActive())) {
            throw new BusinessException("Cannot install kit at inactive address");
        }

        validateAddressForContract(address, contract);

        // 7. Validate kit has at least one equipment
        long activeEquipmentCount = kit.getEquipments() != null
            ? kit.getEquipments().stream().filter(e -> Boolean.TRUE.equals(e.getActive())).count()
            : 0;
        if (activeEquipmentCount == 0) {
            throw new BusinessException("Kit must have at least one equipment to be installed");
        }

        // 7. Determine installation date (default to today)
        LocalDate installDate = request.installationDate() != null
            ? request.installationDate()
            : LocalDate.now();

        // 8. Validate date is within contract validity period
        if (installDate.isBefore(contract.getStartDate())) {
            throw new BusinessException("Installation date cannot be before contract start date");
        }
        if (contract.getEndDate() != null && installDate.isAfter(contract.getEndDate())) {
            throw new BusinessException("Installation date cannot be after contract end date");
        }

        // 9. Update kit
        KitStatus oldStatus = kit.getStatus();
        kit.setStatus(KitStatus.INSTALLED);
        kit.setInstallationDate(installDate);
        kit.setAddress(address);
        EquipmentKit saved = equipmentKitRepository.save(kit);

        // 10. Create installation record
        KitInstallation installation = KitInstallation.builder()
            .kit(saved)
            .address(address)
            .operationType(KitOperationType.INSTALLED)
            .performedBy(getCurrentUser())
            .operationDate(installDate)
            .notes(request.notes())
            .build();
        kitInstallationRepository.save(installation);

        // 11. Record movement history
        movementHistoryService.recordKitStatusChanged(saved, oldStatus, KitStatus.INSTALLED, getCurrentUser());

        log.info("Equipment kit installed successfully with id: {} at address: {}", saved.getId(), address.getId());
        return equipmentKitMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentKitResponse uninstallKit(Long id, KitUninstallRequest request) {
        log.info("Uninstalling equipment kit with id: {}", id);

        // 1. Fetch kit
        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // 2. Validate kit is installed or in maintenance
        if (kit.getStatus() != KitStatus.INSTALLED && kit.getStatus() != KitStatus.MAINTENANCE) {
            throw new BusinessException("Kit is not installed (current status: " + kit.getStatus() + ")");
        }

        // 3. Validate kit has an address to record in history
        Address address = kit.getAddress();
        if (address == null) {
            throw new BusinessException("Kit has no address to uninstall from");
        }

        // 4. Determine uninstallation date (default to today)
        LocalDate uninstallDate = request.uninstallationDate() != null
            ? request.uninstallationDate()
            : LocalDate.now();

        // 5. Build notes with reason if provided
        String notes = request.reason() != null
            ? "Reason: " + request.reason() + (request.notes() != null ? ". " + request.notes() : "")
            : request.notes();

        // 6. Update kit status
        KitStatus oldStatus = kit.getStatus();
        kit.setStatus(KitStatus.REMOVED);

        // 7. Deactivate IoT credentials (device reusable), then unassign all equipment
        handleCredentialsOnRemoval(kit);
        unassignAllEquipment(kit);

        EquipmentKit saved = equipmentKitRepository.save(kit);

        // 8. Create uninstallation record
        KitInstallation installation = KitInstallation.builder()
            .kit(saved)
            .address(address)
            .operationType(KitOperationType.UNINSTALLED)
            .performedBy(getCurrentUser())
            .operationDate(uninstallDate)
            .notes(notes)
            .build();
        kitInstallationRepository.save(installation);

        // 9. Record movement history
        movementHistoryService.recordKitStatusChanged(saved, oldStatus, KitStatus.REMOVED, getCurrentUser());

        log.info("Equipment kit uninstalled successfully with id: {}", saved.getId());
        return equipmentKitMapper.toResponse(saved);
    }

    /**
     * Swap the dead ESP32 gateway for a new one (maintenance §4.1). The sensors, gas points and
     * cylinders stay put; only the gateway changes. Because a sensor's {@code codigoSensor} is
     * {@code <espSerial>|<port>}, every sensor is re-pointed to the new serial so readings keep
     * matching in DynamoDB. Old ESP leaves the fleet (credential revoked); new ESP is provisioned.
     * Requires the kit to be live (INSTALLED or MAINTENANCE).
     */
    @Override
    @Transactional
    public EquipmentKitResponse swapEsp(Long id, SwapEspRequest request) {
        log.info("Swapping ESP32 of kit {} for equipment {}", id, request.newEspEquipmentId());

        EquipmentKit kit = loadLiveKitForMaintenance(id);

        Equipment oldEsp = kit.getEquipments().stream()
            .filter(e -> Boolean.TRUE.equals(e.getActive()) && isEsp32(e))
            .findFirst()
            .orElseThrow(() -> new BusinessException("Kit has no active ESP32 to swap"));

        Equipment newEsp = equipmentRepository.findById(request.newEspEquipmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", request.newEspEquipmentId()));

        if (!isEsp32(newEsp)) {
            throw new BusinessException("Replacement equipment is not an ESP32");
        }
        if (!Boolean.TRUE.equals(newEsp.getActive())) {
            throw new BusinessException("Replacement ESP32 is inactive");
        }
        if (newEsp.getEquipmentKit() != null) {
            throw new BusinessException("Replacement ESP32 is already assigned to a kit");
        }
        if (newEsp.getSerialNumber() == null || newEsp.getSerialNumber().isBlank()) {
            throw new BusinessException("Replacement ESP32 has no serial number");
        }

        String oldSerial = oldEsp.getSerialNumber();
        String newSerial = newEsp.getSerialNumber();
        User user = getCurrentUser();

        // Re-point every sensor to the new gateway and rewrite its codigoSensor (serial|port).
        for (Equipment sensor : kit.getEquipments()) {
            if (!Boolean.TRUE.equals(sensor.getActive()) || !isSensor(sensor)) {
                continue;
            }
            sensor.setParentEquipment(newEsp);
            sensor.setCodigoSensor(buildCodigoSensor(newSerial, sensor.getSensorPort()));
        }

        // New ESP joins the kit and gets a fresh IoT credential.
        kit.addEquipment(newEsp);
        movementHistoryService.recordEquipmentAssignedToKit(newEsp, kit, user);
        deviceProvisioningService.provisionInIoTCore(newEsp);

        // Old ESP sempre sai do kit. O destino depende do motivo da troca:
        oldEsp.setEquipmentKit(null);
        movementHistoryService.recordEquipmentRemovedFromKit(oldEsp, kit, user);
        if (Boolean.TRUE.equals(request.retireOldEsp())) {
            // Aposentar (ESP com defeito): sai da frota — desativa + revoga a credencial (permanente).
            oldEsp.setActive(false);
            movementHistoryService.recordEquipmentDeactivated(oldEsp, user);
            deviceProvisioningService.revokeCredential(oldEsp);
        } else {
            // Devolver ao estoque (ESP ainda bom): continua ativo, credencial só parqueada (reusável).
            deviceProvisioningService.deactivateCredential(oldEsp);
        }

        equipmentRepository.save(oldEsp);
        EquipmentKit saved = equipmentKitRepository.save(kit);

        log.info("Swapped ESP32 of kit {}: {} -> {}", id, oldSerial, newSerial);
        return equipmentKitMapper.toResponse(saved);
    }

    /**
     * Swap a single sensor for a new one on the same ESP port and gas point (maintenance §4.1).
     * The {@code codigoSensor} ({@code serial|port}) is unchanged, so the reading stream is
     * uninterrupted — this is pure inventory bookkeeping. Requires the kit to be live.
     */
    @Override
    @Transactional
    public EquipmentKitResponse swapSensor(Long id, SwapSensorRequest request) {
        log.info("Swapping sensor {} of kit {} for equipment {}",
            request.oldSensorEquipmentId(), id, request.newSensorEquipmentId());

        EquipmentKit kit = loadLiveKitForMaintenance(id);

        Equipment oldSensor = kit.getEquipments().stream()
            .filter(e -> Boolean.TRUE.equals(e.getActive()) && isSensor(e)
                && e.getId().equals(request.oldSensorEquipmentId()))
            .findFirst()
            .orElseThrow(() -> new BusinessException("Sensor not found in kit or not active"));

        Equipment newSensor = equipmentRepository.findById(request.newSensorEquipmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", request.newSensorEquipmentId()));

        if (!isSensor(newSensor)) {
            throw new BusinessException("Replacement equipment is not a Sensor");
        }
        if (!Boolean.TRUE.equals(newSensor.getActive())) {
            throw new BusinessException("Replacement sensor is inactive");
        }
        if (newSensor.getEquipmentKit() != null) {
            throw new BusinessException("Replacement sensor is already assigned to a kit");
        }

        User user = getCurrentUser();

        // New sensor takes over the same port, gas point and codigoSensor.
        newSensor.setParentEquipment(oldSensor.getParentEquipment());
        newSensor.setSensorPort(oldSensor.getSensorPort());
        newSensor.setPontoGas(oldSensor.getPontoGas());
        newSensor.setCodigoSensor(oldSensor.getCodigoSensor());
        kit.addEquipment(newSensor);
        movementHistoryService.recordEquipmentAssignedToKit(newSensor, kit, user);

        // Old sensor sempre sai do kit/ponto. Destino conforme o motivo (sensor não tem credencial).
        oldSensor.setEquipmentKit(null);
        oldSensor.setPontoGas(null);
        movementHistoryService.recordEquipmentRemovedFromKit(oldSensor, kit, user);
        if (Boolean.TRUE.equals(request.retireOldSensor())) {
            oldSensor.setActive(false); // aposentar (defeito)
            movementHistoryService.recordEquipmentDeactivated(oldSensor, user);
        }
        // senão: continua ativo -> volta pro estoque, reutilizável

        equipmentRepository.save(oldSensor);
        EquipmentKit saved = equipmentKitRepository.save(kit);

        log.info("Swapped sensor of kit {}: {} -> {}", id, oldSensor.getId(), newSensor.getId());
        return equipmentKitMapper.toResponse(saved);
    }

    /** Loads a kit that must be live (INSTALLED or MAINTENANCE) for a maintenance swap, tenant-scoped. */
    private EquipmentKit loadLiveKitForMaintenance(Long id) {
        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }
        if (kit.getStatus() != KitStatus.INSTALLED && kit.getStatus() != KitStatus.MAINTENANCE) {
            throw new BusinessException(
                "Kit must be INSTALLED or MAINTENANCE to swap hardware (current: " + kit.getStatus() + ")");
        }
        return kit;
    }

    private boolean isEsp32(Equipment e) {
        EquipmentType t = e.getEquipmentType();
        return t != null && EquipmentType.ESP32_TYPE_NAME.equalsIgnoreCase(t.getName());
    }

    private boolean isSensor(Equipment e) {
        EquipmentType t = e.getEquipmentType();
        return t != null && EquipmentType.SENSOR_TYPE_NAME.equalsIgnoreCase(t.getName());
    }

    private String buildCodigoSensor(String serial, Integer port) {
        return serial + "|" + port;
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating equipment kit with id: {}", id);

        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        kit.setActive(false);
        equipmentKitRepository.save(kit);

        log.info("Equipment kit deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating equipment kit with id: {}", id);

        EquipmentKit kit = equipmentKitRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", id));

        // Validate company access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        // Verify contract still has capacity
        long activeKits = equipmentKitRepository.countActiveByContractId(kit.getContract().getId());
        if (activeKits >= kit.getContract().getKitQuantity()) {
            throw new BusinessException(
                "Cannot activate kit: contract has reached its maximum number of kits"
            );
        }

        kit.setActive(true);
        equipmentKitRepository.save(kit);

        log.info("Equipment kit activated successfully with id: {}", id);
    }

    private void validateAddressForContract(Address address, Contract contract) {
        if (!Objects.equals(address.getCompany().getId(), contract.getCompany().getId())) {
            throw new BusinessException("Address must belong to the same company as the contract");
        }
        boolean allowed = contract.getAllowedAddresses().stream()
            .anyMatch(allowedAddress -> Objects.equals(allowedAddress.getId(), address.getId()));
        if (!allowed) {
            throw new BusinessException("Address is not enabled for this contract");
        }
    }
}
