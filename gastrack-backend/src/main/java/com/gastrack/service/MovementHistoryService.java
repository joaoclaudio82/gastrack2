package com.gastrack.service;

import com.gastrack.dto.movementhistory.MovementHistoryResponse;
import com.gastrack.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for movement history - read-only operations and history recording.
 */
public interface MovementHistoryService {

    // Read operations
    Page<MovementHistoryResponse> findAll(Pageable pageable);

    Page<MovementHistoryResponse> findByEquipment(Long equipmentId, Pageable pageable);

    Page<MovementHistoryResponse> findByKit(Long kitId, MovementOperation operation, Pageable pageable);

    // Recording operations (called by other services)
    void recordEquipmentCreated(Equipment equipment, User user);

    void recordEquipmentAssignedToKit(Equipment equipment, EquipmentKit kit, User user);

    void recordEquipmentRemovedFromKit(Equipment equipment, EquipmentKit previousKit, User user);

    void recordEquipmentTransferred(Equipment equipment, EquipmentKit fromKit, EquipmentKit toKit, User user, String notes);

    void recordEquipmentConditionChanged(Equipment equipment, EquipmentCondition oldCondition, EquipmentCondition newCondition, User user);

    void recordEquipmentDeactivated(Equipment equipment, User user);

    void recordEquipmentReactivated(Equipment equipment, User user);

    void recordKitCreated(EquipmentKit kit, User user);

    void recordKitStatusChanged(EquipmentKit kit, KitStatus oldStatus, KitStatus newStatus, User user);
}
