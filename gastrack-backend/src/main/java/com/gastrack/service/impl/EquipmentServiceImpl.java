package com.gastrack.service.impl;

import com.gastrack.dto.equipment.BatchAssignmentError;
import com.gastrack.dto.equipment.EquipmentAssignRequest;
import com.gastrack.dto.equipment.EquipmentBatchAssignRequest;
import com.gastrack.dto.equipment.EquipmentBatchAssignResponse;
import com.gastrack.dto.equipment.EquipmentRequest;
import com.gastrack.dto.equipment.EquipmentResponse;
import com.gastrack.dto.equipment.EquipmentTransferRequest;
import com.gastrack.dto.equipment.SensorOptionResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.EquipmentMapper;
import com.gastrack.model.*;
import com.gastrack.repository.DeviceCredentialRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.EquipmentTypeRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.DeviceProvisioningService;
import com.gastrack.service.EquipmentService;
import com.gastrack.service.MovementHistoryService;
import com.gastrack.service.TenantSecurityService;
import com.gastrack.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private static final String ESP32_TYPE_NAME = EquipmentType.ESP32_TYPE_NAME;

    private final EquipmentRepository equipmentRepository;
    private final EquipmentKitRepository equipmentKitRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final EquipmentMapper equipmentMapper;
    private final TenantSecurityService tenantSecurityService;
    private final UserService userService;
    private final MovementHistoryService movementHistoryService;
    private final DeviceProvisioningService deviceProvisioningService;
    private final DeviceCredentialRepository deviceCredentialRepository;

    @Override
    @Transactional
    public EquipmentResponse create(EquipmentRequest request) {
        log.info("Creating equipment: {}", request.assetTag());

        // Only SUPER_ADMIN can create equipment (global inventory)
        if (!TenantContext.isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can create equipment");
        }

        EquipmentType type = equipmentTypeRepository.findById(request.equipmentTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", request.equipmentTypeId()));

        EquipmentKit kit = null;
        if (request.equipmentKitId() != null) {
            kit = equipmentKitRepository.findById(request.equipmentKitId())
                .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", request.equipmentKitId()));
        }

        if (equipmentRepository.existsByAssetTag(request.assetTag())) {
            throw new ConflictException("Equipment with this asset tag already exists");
        }

        // serialNumber is only allowed for ESP32 equipment
        boolean isEsp32 = ESP32_TYPE_NAME.equalsIgnoreCase(type.getName());
        if (!isEsp32 && request.serialNumber() != null && !request.serialNumber().isBlank()) {
            throw new BusinessException("Serial number is only allowed for ESP32 equipment");
        }
        if (isEsp32 && (request.serialNumber() == null || request.serialNumber().isBlank())) {
            throw new BusinessException("Serial number is required for ESP32 equipment");
        }
        if (isEsp32) {
            List<Equipment> existing = equipmentRepository.findActiveBySerialNumber(request.serialNumber());
            if (!existing.isEmpty()) {
                throw new ConflictException("An active ESP32 with this serial number already exists");
            }
        }

        Equipment equipment = equipmentMapper.toEntity(request);
        equipment.setEquipmentType(type);
        equipment.setEquipmentKit(kit);
        validateSingleEsp32PerKit(equipment, kit);

        // Set created by if user is logged in
        Long currentUserId = TenantContext.getCurrentUserId();
        if (currentUserId != null) {
            User currentUser = userService.findById(currentUserId);
            equipment.setCreatedBy(currentUser);
        }

        Equipment saved = equipmentRepository.save(equipment);

        // Record history
        User currentUser = getCurrentUser();
        movementHistoryService.recordEquipmentCreated(saved, currentUser);
        if (kit != null) {
            movementHistoryService.recordEquipmentAssignedToKit(saved, kit, currentUser);
        }

        // Auto-provision in IoT Core if equipment type is ESP32.
        // Dev environments without AWS credentials are handled inside the provisioning service,
        // which swallows SdkClientException so registration still succeeds.
        if (ESP32_TYPE_NAME.equalsIgnoreCase(type.getName())) {
            deviceProvisioningService.provisionInIoTCore(saved);
        }

        log.info("Equipment created successfully with id: {}", saved.getId());
        return equipmentMapper.toResponse(saved);
    }

    private User getCurrentUser() {
        Long currentUserId = TenantContext.getCurrentUserId();
        return currentUserId != null ? userService.findById(currentUserId) : null;
    }

    /**
     * Invariant "kit = 1 ESP32": a kit carries exactly one ESP32 (its gateway) + N sensors.
     * Blocks binding an ESP32 to a kit that already has another active ESP32. Sensors don't count.
     * Grandfather: pre-existing kits with >1 ESP32 are never re-validated here (only a NEW binding
     * that would add a second ESP32 is blocked).
     */
    private void validateSingleEsp32PerKit(Equipment equipment, EquipmentKit kit) {
        if (kit == null || equipment.getEquipmentType() == null
            || !ESP32_TYPE_NAME.equalsIgnoreCase(equipment.getEquipmentType().getName())) {
            return;
        }
        boolean kitHasOtherEsp32 = equipmentRepository.findByEquipmentKitIdAndActive(kit.getId(), true).stream()
            .anyMatch(e -> !e.getId().equals(equipment.getId())
                && e.getEquipmentType() != null
                && ESP32_TYPE_NAME.equalsIgnoreCase(e.getEquipmentType().getName()));
        if (kitHasOtherEsp32) {
            throw new BusinessException(
                "Kit already has an active ESP32; a kit supports exactly one ESP32 (kit = 1 ESP)");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public EquipmentResponse findById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        // Validate access for non-super admin
        if (!TenantContext.isSuperAdmin() && equipment.getCompany() != null) {
            tenantSecurityService.validateCompanyAccess(equipment.getCompany().getId());
        }

        return equipmentMapper.toResponse(equipment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentResponse> findAll(
        Pageable pageable,
        String assignment,
        EquipmentCondition condition,
        Long typeId,
        Long kitId,
        Long companyId
    ) {
        Long effectiveCompanyId = companyId;
        if (!TenantContext.isSuperAdmin()) {
            effectiveCompanyId = tenantSecurityService.requireCompanyContext();
        }

        String normalizedAssignment = normalizeAssignment(assignment);

        // Hibernate 7 + PostgreSQL: null parameters in JPQL cause type mismatch
        // Use sentinel values (-1L for Long, '' for String) instead of null
        Page<Equipment> equipments = equipmentRepository.search(
            effectiveCompanyId != null ? effectiveCompanyId : -1L,
            kitId != null ? kitId : -1L,
            typeId != null ? typeId : -1L,
            condition,
            normalizedAssignment != null ? normalizedAssignment : "",
            pageable
        );

        return equipments.map(equipmentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentResponse> findUnassigned(Pageable pageable) {
        // Only SUPER_ADMIN can see unassigned equipment (inventory view)
        if (!TenantContext.isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can view unassigned equipment");
        }

        return equipmentRepository.findUnassigned(pageable)
            .map(equipmentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentResponse> findByKit(Long kitId, Pageable pageable) {
        EquipmentKit kit = equipmentKitRepository.findById(kitId)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", kitId));

        // Validate access
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        return equipmentRepository.findByEquipmentKitId(kitId, pageable)
            .map(equipmentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EquipmentResponse> findByType(Long typeId, Pageable pageable) {
        return equipmentRepository.findByEquipmentTypeIdAndActive(typeId, true, pageable)
            .map(equipmentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SensorOptionResponse> getSensorOptionsForKit(Long kitId) {
        EquipmentKit kit = equipmentKitRepository.findById(kitId)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", kitId));
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }
        EquipmentType esp32Type = equipmentTypeRepository.findByName(ESP32_TYPE_NAME)
            .orElseThrow(() -> new BusinessException("Equipment type ESP32 not found"));
        List<Equipment> esp32List = equipmentRepository.findByEquipmentKitIdAndActive(kitId, true)
            .stream()
            .filter(e -> esp32Type.getId().equals(e.getEquipmentType().getId()))
            .toList();
        List<SensorOptionResponse> options = new ArrayList<>();
        for (Equipment esp32 : esp32List) {
            String serial = esp32.getSerialNumber() != null ? esp32.getSerialNumber() : "";
            String assetTag = esp32.getAssetTag();
            for (int port = 1; port <= 8; port++) {
                int sensorPort = port;
                String codigo = serial + "|" + sensorPort;
                String label = serial.isEmpty()
                    ? assetTag + " - Porta " + sensorPort
                    : serial + " - Porta " + sensorPort;
                Long existingId = equipmentRepository.findByParentEquipmentIdAndSensorPort(esp32.getId(), sensorPort)
                    .map(Equipment::getId)
                    .orElse(null);
                options.add(new SensorOptionResponse(
                    esp32.getId(),
                    serial.isEmpty() ? null : serial,
                    assetTag,
                    sensorPort,
                    codigo,
                    label,
                    existingId
                ));
            }
        }
        return options;
    }

    @Override
    @Transactional
    public EquipmentResponse update(Long id, EquipmentRequest request) {
        log.info("Updating equipment with id: {}", id);

        // Only SUPER_ADMIN can update equipment
        if (!TenantContext.isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can update equipment");
        }

        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        EquipmentType type = equipmentTypeRepository.findById(request.equipmentTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentType", "id", request.equipmentTypeId()));

        EquipmentKit kit = null;
        if (request.equipmentKitId() != null) {
            kit = equipmentKitRepository.findById(request.equipmentKitId())
                .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", request.equipmentKitId()));
        }

        // Check if new asset tag conflicts with another equipment
        if (!equipment.getAssetTag().equals(request.assetTag())) {
            equipmentRepository.findByAssetTag(request.assetTag())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new ConflictException("Equipment with this asset tag already exists");
                    }
                });
        }

        boolean isEsp32 = ESP32_TYPE_NAME.equalsIgnoreCase(type.getName());
        boolean wasEsp32 = ESP32_TYPE_NAME.equalsIgnoreCase(equipment.getEquipmentType().getName());

        // serialNumber is only allowed for ESP32 equipment
        if (!isEsp32 && request.serialNumber() != null && !request.serialNumber().isBlank()) {
            throw new BusinessException("Serial number is only allowed for ESP32 equipment");
        }
        if (isEsp32 && (request.serialNumber() == null || request.serialNumber().isBlank())) {
            throw new BusinessException("Serial number is required for ESP32 equipment");
        }
        if (isEsp32) {
            List<Equipment> existingWithSerial = equipmentRepository.findActiveBySerialNumber(request.serialNumber());
            boolean duplicateSerial = existingWithSerial.stream().anyMatch(e -> !e.getId().equals(id));
            if (duplicateSerial) {
                throw new ConflictException("An active ESP32 with this serial number already exists");
            }
        }

        equipmentMapper.updateEntity(request, equipment);
        equipment.setEquipmentType(type);
        equipment.setEquipmentKit(kit);
        validateSingleEsp32PerKit(equipment, kit);

        // Clear serialNumber and orphaned DeviceCredential if type changed away from ESP32
        if (wasEsp32 && !isEsp32) {
            equipment.setSerialNumber(null);
            deviceCredentialRepository.findByEquipmentId(equipment.getId())
                .ifPresent(deviceCredentialRepository::delete);
        }

        Equipment saved = equipmentRepository.save(equipment);

        // Provision in IoT Core when:
        // 1. type just changed to ESP32 (new device), OR
        // 2. already ESP32 but has no DeviceCredential yet (created before auto-provisioning existed,
        //    or serial was added after initial creation)
        if (isEsp32) {
            boolean missingCredential = deviceCredentialRepository.findByEquipmentId(saved.getId()).isEmpty();
            if (!wasEsp32 || missingCredential) {
                deviceProvisioningService.provisionInIoTCore(saved);
            }
        }

        log.info("Equipment updated successfully with id: {}", saved.getId());
        return equipmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentResponse assignToKit(Long id, EquipmentAssignRequest request) {
        log.info("Assigning equipment {} to kit {}", id, request.kitId());

        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        // Validate access - only SUPER_ADMIN or ADMIN of target kit's company
        EquipmentKit kit = equipmentKitRepository.findById(request.kitId())
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", request.kitId()));

        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        if (equipment.isAssigned()) {
            throw new BusinessException("Equipment is already assigned to a kit. Remove it first or use transfer.");
        }

        validateSingleEsp32PerKit(equipment, kit);

        equipment.setEquipmentKit(kit);
        Equipment saved = equipmentRepository.save(equipment);

        // Record history
        movementHistoryService.recordEquipmentAssignedToKit(saved, kit, getCurrentUser());

        log.info("Equipment {} assigned to kit {} successfully", id, request.kitId());
        return equipmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentBatchAssignResponse assignMultipleToKit(EquipmentBatchAssignRequest request) {
        log.info("Batch assigning {} equipment(s) to kit {}", request.equipmentIds().size(), request.kitId());

        // Validate kit exists and user has access
        EquipmentKit kit = equipmentKitRepository.findById(request.kitId())
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", request.kitId()));

        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        List<EquipmentResponse> assigned = new ArrayList<>();
        List<BatchAssignmentError> errors = new ArrayList<>();

        for (Long equipmentId : request.equipmentIds()) {
            try {
                Optional<Equipment> optionalEquipment = equipmentRepository.findById(equipmentId);

                if (optionalEquipment.isEmpty()) {
                    errors.add(new BatchAssignmentError(
                        equipmentId,
                        "NOT_FOUND",
                        "Equipment not found"
                    ));
                    continue;
                }

                Equipment equipment = optionalEquipment.get();

                if (equipment.isAssigned()) {
                    errors.add(new BatchAssignmentError(
                        equipmentId,
                        "ALREADY_ASSIGNED",
                        "Equipment is already assigned to a kit"
                    ));
                    continue;
                }

                if (!equipment.getActive()) {
                    errors.add(new BatchAssignmentError(
                        equipmentId,
                        "INACTIVE",
                        "Equipment is inactive"
                    ));
                    continue;
                }

                validateSingleEsp32PerKit(equipment, kit);

                equipment.setEquipmentKit(kit);
                Equipment saved = equipmentRepository.save(equipment);
                assigned.add(equipmentMapper.toResponse(saved));

                // Record history
                movementHistoryService.recordEquipmentAssignedToKit(saved, kit, getCurrentUser());

                log.debug("Equipment {} assigned to kit {} successfully", equipmentId, request.kitId());

            } catch (Exception e) {
                log.error("Error assigning equipment {} to kit {}: {}", equipmentId, request.kitId(), e.getMessage());
                errors.add(new BatchAssignmentError(
                    equipmentId,
                    "INTERNAL_ERROR",
                    "Failed to assign equipment: " + e.getMessage()
                ));
            }
        }

        log.info("Batch assignment completed: {} success, {} failures",
            assigned.size(), errors.size());

        return new EquipmentBatchAssignResponse(
            request.equipmentIds().size(),
            assigned.size(),
            errors.size(),
            assigned,
            errors
        );
    }

    @Override
    @Transactional
    public EquipmentResponse removeFromKit(Long id) {
        log.info("Removing equipment {} from kit", id);

        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        // Validate access
        if (!TenantContext.isSuperAdmin()) {
            if (equipment.getCompany() != null) {
                tenantSecurityService.validateCompanyAccess(equipment.getCompany().getId());
            }
        }

        if (!equipment.isAssigned()) {
            throw new BusinessException("Equipment is not assigned to any kit");
        }

        EquipmentKit previousKit = equipment.getEquipmentKit();
        equipment.setEquipmentKit(null);
        Equipment saved = equipmentRepository.save(equipment);

        // Record history
        movementHistoryService.recordEquipmentRemovedFromKit(saved, previousKit, getCurrentUser());

        log.info("Equipment {} removed from kit successfully", id);
        return equipmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EquipmentResponse transfer(Long id, EquipmentTransferRequest request) {
        log.info("Transferring equipment {} to kit {}", id, request.targetKitId());

        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        EquipmentKit targetKit = equipmentKitRepository.findById(request.targetKitId())
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", request.targetKitId()));

        // Validate access - ADMIN needs access to both source and target companies
        if (!TenantContext.isSuperAdmin()) {
            if (equipment.getCompany() != null) {
                tenantSecurityService.validateCompanyAccess(equipment.getCompany().getId());
            }
            tenantSecurityService.validateCompanyAccess(targetKit.getCompany().getId());
        }

        if (!equipment.isAssigned()) {
            throw new BusinessException("Equipment is not assigned to any kit. Use assign-to-kit instead.");
        }

        if (equipment.getEquipmentKit().getId().equals(request.targetKitId())) {
            throw new BusinessException("Equipment is already in the target kit");
        }

        validateSingleEsp32PerKit(equipment, targetKit);

        // Perform transfer
        EquipmentKit sourceKit = equipment.getEquipmentKit();
        equipment.setEquipmentKit(targetKit);

        // Add transfer note if provided
        if (request.notes() != null && !request.notes().isBlank()) {
            String currentNotes = equipment.getNotes() != null ? equipment.getNotes() : "";
            String transferNote = String.format("[Transfer from %s to %s] %s",
                sourceKit.getKitCode(), targetKit.getKitCode(), request.notes());
            equipment.setNotes(currentNotes.isBlank() ? transferNote : currentNotes + "\n" + transferNote);
        }

        Equipment saved = equipmentRepository.save(equipment);

        // Record history
        movementHistoryService.recordEquipmentTransferred(saved, sourceKit, targetKit, getCurrentUser(), request.notes());

        log.info("Equipment {} transferred from kit {} to kit {} successfully",
            id, sourceKit.getId(), request.targetKitId());
        return equipmentMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating equipment with id: {}", id);

        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        // Only SUPER_ADMIN can deactivate equipment
        if (!TenantContext.isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can deactivate equipment");
        }

        equipment.setActive(false);
        Equipment saved = equipmentRepository.save(equipment);

        // Device leaving the fleet: revoke the ESP32's IoT credential so it can no longer publish.
        // (Kit REMOVED only deactivates/parks the credential for reuse; retiring the device revokes.)
        EquipmentType type = equipment.getEquipmentType();
        if (type != null && ESP32_TYPE_NAME.equalsIgnoreCase(type.getName())) {
            deviceProvisioningService.revokeCredential(equipment);
        }

        // Record history
        movementHistoryService.recordEquipmentDeactivated(saved, getCurrentUser());

        log.info("Equipment deactivated successfully with id: {}", id);
    }

    @Override
    @Transactional
    public void activate(Long id) {
        log.info("Activating equipment with id: {}", id);

        Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", id));

        // Only SUPER_ADMIN can activate equipment
        if (!TenantContext.isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can activate equipment");
        }

        equipment.setActive(true);
        Equipment saved = equipmentRepository.save(equipment);

        // Record history
        movementHistoryService.recordEquipmentReactivated(saved, getCurrentUser());

        log.info("Equipment activated successfully with id: {}", id);
    }

    private String normalizeAssignment(String assignment) {
        if (assignment == null) {
            return null;
        }
        String value = assignment.trim().toLowerCase();
        if (value.isEmpty() || "all".equals(value)) {
            return null;
        }
        if ("assigned".equals(value) || "unassigned".equals(value)) {
            return value;
        }
        return null;
    }
}
