package com.gastrack.dto.cylindermodel;

import com.gastrack.model.GasType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CylinderModelResponse(
    Long id,
    String codigo,
    GasType gasType,
    BigDecimal waterVolumeLiters,
    BigDecimal capacityBar,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
