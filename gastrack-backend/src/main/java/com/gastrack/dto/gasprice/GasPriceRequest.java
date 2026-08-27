package com.gastrack.dto.gasprice;

import com.gastrack.model.GasType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GasPriceRequest(
    @NotNull(message = "Company ID is required")
    Long companyId,

    @NotNull(message = "Gas type is required")
    GasType gasType,

    @NotNull(message = "Price per m3 is required")
    @DecimalMin(value = "0.0", message = "Price per m3 must be zero or greater")
    BigDecimal pricePerM3,

    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code")
    String currency,

    LocalDateTime validFrom
) {}
