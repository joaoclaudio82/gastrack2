package com.gastrack.dto.equipment;

import com.gastrack.model.EquipmentCondition;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EquipmentResponse(
    Long id,
    Long equipmentKitId,
    String kitCode,
    Long equipmentTypeId,
    String equipmentTypeName,
    Long companyId,
    String companyName,
    String assetTag,
    String description,
    String serialNumber,
    String manufacturer,
    String model,
    String purchaseUrl,
    LocalDate purchaseDate,
    LocalDate warrantyExpirationDate,
    EquipmentCondition condition,
    String notes,
    Boolean active,
    Long createdById,
    String createdByName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
