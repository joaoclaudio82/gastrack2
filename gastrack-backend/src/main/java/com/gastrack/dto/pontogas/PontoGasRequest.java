package com.gastrack.dto.pontogas;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PontoGasRequest(

    @NotNull(message = "Address ID is required")
    Long addressId,

    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    String location,

    /**
     * Optional Sensor equipment IDs to associate with this gas point on create/update.
     * Only equipments of type Sensor (parent ESP32 + sensor_port) can be associated.
     */
    List<Long> sensorEquipmentIds,

    /**
     * Optional (parent ESP32, port) pairs to create Sensor equipment and associate.
     * Used when the sensor does not exist yet.
     */
    @Valid
    List<SensorAssignment> sensorsToAdd
) {}
