package com.gastrack.dto.gasprice;

import com.gastrack.model.GasType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GasPriceResponse(
    Long id,
    Long companyId,
    String companyName,
    GasType gasType,
    BigDecimal pricePerM3,
    String currency,
    LocalDateTime validFrom,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
