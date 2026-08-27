package com.gastrack.dto.pressure;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class PressureFilterParams {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 500;
    private static final long DEFAULT_LOOKBACK_SECONDS = 30 * 60L; // 30 minutos

    private String deviceId;
    private Integer sensorId;
    private Long startTimestamp;
    private Long endTimestamp;
    private Integer limit;
    private String cursor;

    public void validate() {
        if (deviceId == null || deviceId.isBlank()) {
            throw new IllegalArgumentException("deviceId is required");
        }
        if (sensorId != null && (sensorId < 1 || sensorId > 8)) {
            throw new IllegalArgumentException("sensorId must be between 1 and 8");
        }
        if (startTimestamp != null && endTimestamp != null && startTimestamp >= endTimestamp) {
            throw new IllegalArgumentException("startTimestamp must be before endTimestamp");
        }
    }

    public int getLimitOrDefault() {
        Integer requestedLimit = limit;
        if (requestedLimit == null || requestedLimit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(requestedLimit, MAX_LIMIT);
    }

    public long getEffectiveStartTimestamp() {
        if (startTimestamp != null) {
            return startTimestamp;
        }
        long effectiveEnd = getEffectiveEndTimestamp();
        return effectiveEnd - DEFAULT_LOOKBACK_SECONDS;
    }

    public long getEffectiveEndTimestamp() {
        if (endTimestamp != null) {
            return endTimestamp;
        }
        return Instant.now().getEpochSecond();
    }
}
