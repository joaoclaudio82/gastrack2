package com.gastrack.dto.equipmenttype;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EquipmentTypeRequest(
    @NotBlank(message = "Equipment type name is required")
    @Size(max = 100, message = "Equipment type name must not exceed 100 characters")
    String name,

    @Size(max = 500, message = "Description must not exceed 500 characters")
    String description
) {}
