package com.gastrack.service.impl;

import com.gastrack.dto.movementhistory.MovementHistoryResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.MovementHistoryMapper;
import com.gastrack.model.*;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.MovementHistoryRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.MovementHistoryService;
import com.gastrack.service.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovementHistoryServiceImpl implements MovementHistoryService {

    private final MovementHistoryRepository movementHistoryRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentKitRepository equipmentKitRepository;
    private final MovementHistoryMapper movementHistoryMapper;
    private final TenantSecurityService tenantSecurityService;

    @Override
    @Transactional(readOnly = true)
    public Page<MovementHistoryResponse> findAll(Pageable pageable) {
        if (TenantContext.isSuperAdmin()) {
            // Super admin can see all history
            return movementHistoryRepository.findAllByOrderByOperationAtDesc(pageable)
                .map(movementHistoryMapper::toResponse);
        }

        // For non-super admin, filter by company
        Long companyId = tenantSecurityService.requireCompanyContext();
        return movementHistoryRepository.findByCompanyId(companyId, pageable)
            .map(movementHistoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovementHistoryResponse> findByEquipment(Long equipmentId, Pageable pageable) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment", "id", equipmentId));

        // Validate access for non-super admin
        if (!TenantContext.isSuperAdmin() && equipment.getCompany() != null) {
            tenantSecurityService.validateCompanyAccess(equipment.getCompany().getId());
        }

        return movementHistoryRepository.findByEquipmentId(equipmentId, pageable)
            .map(movementHistoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MovementHistoryResponse> findByKit(Long kitId, MovementOperation operation, Pageable pageable) {
        EquipmentKit kit = equipmentKitRepository.findById(kitId)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentKit", "id", kitId));

        // Validate access for non-super admin
        if (!TenantContext.isSuperAdmin()) {
            tenantSecurityService.validateCompanyAccess(kit.getCompany().getId());
        }

        // Find all history related to this kit (associated, source, or destination), optionally by operation
        return movementHistoryRepository.findAllRelatedToKit(kitId, operation, pageable)
            .map(movementHistoryMapper::toResponse);
    }

    @Override
    @Transactional
    public void recordEquipmentCreated(Equipment equipment, User user) {
        log.debug("Recording equipment created: {}", equipment.getAssetTag());

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(equipment.getEquipmentKit())
            .user(user)
            .operation(MovementOperation.CREATED)
            .operationAt(LocalDateTime.now())
            .toKit(equipment.getEquipmentKit())
            .notes("Equipamento criado com patrimônio: " + equipment.getAssetTag())
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordEquipmentAssignedToKit(Equipment equipment, EquipmentKit kit, User user) {
        log.debug("Recording equipment {} assigned to kit {}", equipment.getAssetTag(), kit.getKitCode());

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(kit)
            .user(user)
            .operation(MovementOperation.ASSIGNED_TO_KIT)
            .operationAt(LocalDateTime.now())
            .toKit(kit)
            .notes("Vinculado ao kit: " + kit.getKitCode())
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordEquipmentRemovedFromKit(Equipment equipment, EquipmentKit previousKit, User user) {
        log.debug("Recording equipment {} removed from kit {}", equipment.getAssetTag(), previousKit.getKitCode());

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(previousKit)
            .user(user)
            .operation(MovementOperation.REMOVED_FROM_KIT)
            .operationAt(LocalDateTime.now())
            .fromKit(previousKit)
            .notes("Removido do kit: " + previousKit.getKitCode())
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordEquipmentTransferred(Equipment equipment, EquipmentKit fromKit, EquipmentKit toKit, User user, String notes) {
        log.debug("Recording equipment {} transferred from {} to {}",
            equipment.getAssetTag(), fromKit.getKitCode(), toKit.getKitCode());

        String historyNotes = String.format("Transferido de %s para %s", fromKit.getKitCode(), toKit.getKitCode());
        if (notes != null && !notes.isBlank()) {
            historyNotes += ". " + notes;
        }

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(toKit)  // Associate with destination kit for query filtering
            .user(user)
            .operation(MovementOperation.TRANSFERRED)
            .operationAt(LocalDateTime.now())
            .fromKit(fromKit)
            .toKit(toKit)
            .notes(historyNotes)
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordEquipmentConditionChanged(Equipment equipment, EquipmentCondition oldCondition, EquipmentCondition newCondition, User user) {
        log.debug("Recording equipment {} condition changed from {} to {}",
            equipment.getAssetTag(), oldCondition, newCondition);

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(equipment.getEquipmentKit())
            .user(user)
            .operation(MovementOperation.CONDITION_CHANGED)
            .operationAt(LocalDateTime.now())
            .notes(String.format("Condição alterada de %s para %s", oldCondition, newCondition))
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordEquipmentDeactivated(Equipment equipment, User user) {
        log.debug("Recording equipment {} deactivated", equipment.getAssetTag());

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(equipment.getEquipmentKit())
            .user(user)
            .operation(MovementOperation.DEACTIVATED)
            .operationAt(LocalDateTime.now())
            .notes("Equipamento desativado")
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordEquipmentReactivated(Equipment equipment, User user) {
        log.debug("Recording equipment {} reactivated", equipment.getAssetTag());

        MovementHistory history = MovementHistory.builder()
            .equipment(equipment)
            .equipmentKit(equipment.getEquipmentKit())
            .user(user)
            .operation(MovementOperation.REACTIVATED)
            .operationAt(LocalDateTime.now())
            .notes("Equipamento reativado")
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordKitCreated(EquipmentKit kit, User user) {
        log.debug("Recording kit {} created", kit.getKitCode());

        MovementHistory history = MovementHistory.builder()
            .equipmentKit(kit)
            .user(user)
            .operation(MovementOperation.KIT_CREATED)
            .operationAt(LocalDateTime.now())
            .notes("Kit criado com o código: " + kit.getKitCode())
            .build();

        movementHistoryRepository.save(history);
    }

    @Override
    @Transactional
    public void recordKitStatusChanged(EquipmentKit kit, KitStatus oldStatus, KitStatus newStatus, User user) {
        log.debug("Recording kit {} status changed from {} to {}", kit.getKitCode(), oldStatus, newStatus);

        MovementOperation operation = mapKitStatusToOperation(newStatus);

        // Build notes with address info for install/uninstall operations
        String notes = buildKitStatusChangeNotes(kit, oldStatus, newStatus);

        MovementHistory history = MovementHistory.builder()
            .equipmentKit(kit)
            .user(user)
            .operation(operation)
            .operationAt(LocalDateTime.now())
            .notes(notes)
            .build();

        movementHistoryRepository.save(history);
    }

    private String buildKitStatusChangeNotes(EquipmentKit kit, KitStatus oldStatus, KitStatus newStatus) {
        String addressInfo = kit.getAddress() != null ? kit.getAddress().getName() : null;

        return switch (newStatus) {
            case INSTALLED -> addressInfo != null
                ? String.format("Instalado no endereço: %s", addressInfo)
                : "Kit instalado";
            case REMOVED -> addressInfo != null
                ? String.format("Desinstalado do endereço: %s", addressInfo)
                : "Kit desinstalado";
            case MAINTENANCE -> addressInfo != null
                ? String.format("Em manutenção no endereço: %s", addressInfo)
                : "Kit em manutenção";
            case DECOMMISSIONED -> "Kit descomissionado";
            case PENDING -> String.format("Status alterado de %s para %s", oldStatus, newStatus);
        };
    }

    private MovementOperation mapKitStatusToOperation(KitStatus status) {
        return switch (status) {
            case INSTALLED -> MovementOperation.KIT_INSTALLED;
            case MAINTENANCE -> MovementOperation.KIT_MAINTENANCE_START;
            case REMOVED -> MovementOperation.KIT_REMOVED;
            case DECOMMISSIONED -> MovementOperation.KIT_DECOMMISSIONED;
            case PENDING -> MovementOperation.KIT_CREATED;
        };
    }
}
