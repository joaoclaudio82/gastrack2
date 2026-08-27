package com.gastrack.dto.equipment;

import com.gastrack.model.EquipmentCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EquipmentRequest(
    Long equipmentKitId,

    @NotNull(message = "Equipment type ID is required")
    Long equipmentTypeId,

    @NotBlank(message = "Asset tag is required")
    @Size(max = 50, message = "Asset tag must not exceed 50 characters")
    String assetTag,

    @Size(max = 255, message = "Description must not exceed 255 characters")
    String description,

    @Size(max = 100, message = "Serial number must not exceed 100 characters")
    String serialNumber,

    @Size(max = 100, message = "Manufacturer must not exceed 100 characters")
    String manufacturer,

    @Size(max = 100, message = "Model must not exceed 100 characters")
    String model,

    @Size(max = 500, message = "Purchase URL must not exceed 500 characters")
    String purchaseUrl,

    LocalDate purchaseDate,

    LocalDate warrantyExpirationDate,

    EquipmentCondition condition,

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    String notes
) {}
