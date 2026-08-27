package com.gastrack.dto.pontogas;

import jakarta.validation.constraints.NotNull;

/**
 * Assignment of (ESP32, port) to create a Sensor equipment on the fly.
 */
public record SensorAssignment(
    @NotNull Long parentEquipmentId,
    @NotNull Integer sensorPort
) {}
