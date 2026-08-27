package com.gastrack.dto.equipmentkit;

import com.gastrack.model.KitStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record EquipmentKitResponse(
    Long id,
    Long contractId,
    String contractNumber,
    Long companyId,
    String companyName,
    Long addressId,
    String addressName,
    String kitCode,
    LocalDate installationDate,
    KitStatus status,
    String notes,
    Integer equipmentCount,
    Boolean active,
    Long createdById,
    String createdByName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    /** Populated only on the detail endpoint (GET /{id}); null on the listing to avoid N+1. */
    List<KitCylinderView> cylinders
) {
    public EquipmentKitResponse withCylinders(List<KitCylinderView> cylinders) {
        return new EquipmentKitResponse(id, contractId, contractNumber, companyId, companyName,
            addressId, addressName, kitCode, installationDate, status, notes, equipmentCount,
            active, createdById, createdByName, createdAt, updatedAt, cylinders);
    }
}
