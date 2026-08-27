package com.gastrack.dto.equipmentkit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EquipmentKitRequest(
    @NotNull(message = "Contract ID is required")
    Long contractId,

    Long addressId,

    @NotBlank(message = "Kit code is required")
    @Size(max = 50, message = "Kit code must not exceed 50 characters")
    String kitCode,

    LocalDate installationDate,

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    String notes
) {}
