package com.gastrack.dto.pontogas;

/**
 * Lightweight equipment representation for gas point responses.
 * For Sensor type: includes codigoSensor (device_id|sensor_id), parentSerial (ESP32 serial), sensorPort.
 */
public record PontoGasEquipmentResponse(
    Long id,
    String assetTag,
    String equipmentTypeName,
    String serialNumber,
    String codigoSensor,
    Integer sensorPort,
    String parentSerial,
    Boolean active
) {}

