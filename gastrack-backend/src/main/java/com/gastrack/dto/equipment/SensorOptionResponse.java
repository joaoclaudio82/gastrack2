package com.gastrack.dto.equipment;

/**
 * Option for associating a sensor (ESP32 + port) to a gas point.
 * When existingSensorId is present, use sensorEquipmentIds. Otherwise use sensorsToAdd.
 */
public record SensorOptionResponse(
    Long parentEquipmentId,
    String parentSerial,
    String parentAssetTag,
    Integer sensorPort,
    String codigoSensor,
    String label,
    Long existingSensorId
) {}
