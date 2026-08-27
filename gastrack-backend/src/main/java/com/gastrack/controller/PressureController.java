package com.gastrack.controller;

import com.gastrack.dto.pressure.PaginatedPressureResponse;
import com.gastrack.dto.pressure.PressureFilterParams;
import com.gastrack.service.PressureReadingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pressure")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pressure Readings", description = "Pressure monitoring data from IoT sensors")
public class PressureController {

    private final PressureReadingService pressureReadingService;

    @GetMapping("/readings")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get pressure readings",
            description = "Retrieves paginated pressure readings for a specific device using cursor-based pagination. " +
                    "Defaults to last 30 minutes when timestamps are not provided. " +
                    "Limit is capped at 500. Use the nextCursor from the response to fetch the next page."
    )
    public ResponseEntity<PaginatedPressureResponse> getPressureReadings(
            @Parameter(description = "Device ID (required)", required = true)
            @RequestParam String deviceId,

            @Parameter(description = "Filter by sensor port 1-8. When omitted, returns all ports.")
            @RequestParam(required = false) Integer sensorId,

            @Parameter(description = "Filter by start timestamp (Unix seconds). Defaults to 30 minutes ago.")
            @RequestParam(required = false) Long startTimestamp,

            @Parameter(description = "Filter by end timestamp (Unix seconds). Defaults to now.")
            @RequestParam(required = false) Long endTimestamp,

            @Parameter(description = "Items per page (default: 50, max: 500)")
            @RequestParam(defaultValue = "50") Integer limit,

            @Parameter(description = "Cursor for next page (from previous response's nextCursor)")
            @RequestParam(required = false) String cursor
    ) {
        log.info("[DEBUG-PRESSURE] Request params - deviceId: {}, sensorId: {}, startTimestamp: {}, endTimestamp: {}, limit: {}, cursor: {}",
                deviceId, sensorId, startTimestamp, endTimestamp, limit, cursor != null ? "present" : "null");

        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId(deviceId)
                .sensorId(sensorId)
                .startTimestamp(startTimestamp)
                .endTimestamp(endTimestamp)
                .limit(limit)
                .cursor(cursor)
                .build();

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);

        // Debug: check unique sensorIds in response
        var sensorIds = response.getData().stream()
                .map(r -> r.getSensorId())
                .distinct()
                .toList();
        log.info("[DEBUG-PRESSURE] Response - count: {}, uniqueSensorIds: {}", response.getData().size(), sensorIds);

        return ResponseEntity.ok(response);
    }
}
