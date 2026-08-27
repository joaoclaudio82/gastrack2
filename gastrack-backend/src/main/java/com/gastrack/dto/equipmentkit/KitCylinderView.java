package com.gastrack.dto.equipmentkit;

import com.gastrack.model.CylinderStatus;
import com.gastrack.model.GasType;

import java.math.BigDecimal;

/**
 * Flat view of a cylinder installed on one of a kit's gas points, for the kit detail.
 * The pressure reading (currentPressureBar/status) lives on the {@link com.gastrack.model.PontoGas},
 * not the cylinder.
 */
public record KitCylinderView(
    Long cylinderId,
    String serialNumber,
    GasType gasType,
    Long pontoGasId,
    String pontoGasName,
    BigDecimal currentPressureBar,
    CylinderStatus status
) {}
