package com.gastrack.dto.pressure;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PressureReadingResponse {
    private String deviceId;
    private Integer sensorId;
    private String datetime;
    private Double pressureBar;
    private Integer adc;
    private Long timestamp;

    // Enrichment fields (ESP32/Kit/Address level)
    private Long equipmentId;
    private String equipmentSerial;
    private Long kitId;
    private String kitCode;
    private Long addressId;
    private String addressName;
    private Long companyId;
    private String companyName;
}

