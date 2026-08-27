package com.gastrack.dto.cylinder;

import com.gastrack.model.GasType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CylinderResponse(
    Long id,
    String serialNumber,
    Long cylinderModelId,
    Long companyId,
    String companyName,
    Long pontoGasId,
    Long addressId,
    GasType gasType,
    BigDecimal waterVolumeLiters,
    BigDecimal capacityBar,
    BigDecimal pricePerM3,
    /** Válvula aberta no manifold — só cilindro conectado entra no volume da linha. */
    Boolean connected,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
