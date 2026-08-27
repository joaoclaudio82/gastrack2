package com.gastrack.dto.equipmentkit;

import jakarta.validation.constraints.NotNull;

/**
 * Swap the ESP32 gateway of an installed kit (maintenance §4.1). The replacement is an
 * ESP32 already in inventory (unassigned); its serial replaces the dead one in every
 * sensor {@code codigoSensor} so readings keep flowing.
 */
public record SwapEspRequest(
    @NotNull Long newEspEquipmentId,
    /** true = aposentar o ESP atual (defeito): desativa + revoga credencial.
     *  false/null = devolver ao estoque (ainda bom): mantém ativo, credencial só parqueada. */
    Boolean retireOldEsp,
    String notes
) {}
