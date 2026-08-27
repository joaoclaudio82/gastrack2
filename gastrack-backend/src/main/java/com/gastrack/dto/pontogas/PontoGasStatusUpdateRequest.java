package com.gastrack.dto.pontogas;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Pressure reading pushed to a gas point. Status and fill are derived from it.
 */
public record PontoGasStatusUpdateRequest(
    @NotNull(message = "Current pressure is required")
    @DecimalMin(value = "0", message = "Pressure must be non-negative")
    BigDecimal currentPressureBar
) {}
