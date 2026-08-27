package com.gastrack.dto.cylindermodel;

import com.gastrack.model.GasType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CylinderModelRequest(
    @NotBlank(message = "Codigo is required")
    @Size(max = 50, message = "Codigo must not exceed 50 characters")
    String codigo,

    @NotNull(message = "Gas type is required")
    GasType gasType,

    @NotNull(message = "Water volume is required")
    @DecimalMin(value = "0.01", message = "Water volume must be greater than 0")
    BigDecimal waterVolumeLiters,

    @NotNull(message = "Capacity is required")
    @DecimalMin(value = "0.01", message = "Capacity must be greater than 0")
    BigDecimal capacityBar
) {}
