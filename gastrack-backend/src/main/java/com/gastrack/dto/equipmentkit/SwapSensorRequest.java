package com.gastrack.dto.equipmentkit;

import jakarta.validation.constraints.NotNull;

/**
 * Swap a single sensor of an installed kit (maintenance §4.1). The replacement takes over the
 * same ESP port, gas point and {@code codigoSensor} ({@code serial|port} is unchanged), so the
 * reading stream is uninterrupted; this is inventory bookkeeping only.
 */
public record SwapSensorRequest(
    @NotNull Long oldSensorEquipmentId,
    @NotNull Long newSensorEquipmentId,
    /** true = aposentar o sensor atual (defeito). false/null = devolver ao estoque (reusável). */
    Boolean retireOldSensor,
    String notes
) {}
