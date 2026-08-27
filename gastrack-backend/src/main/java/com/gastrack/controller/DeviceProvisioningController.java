package com.gastrack.controller;

import com.gastrack.dto.device.DeviceProvisioningResponse;
import com.gastrack.service.DevicePingLogService;
import com.gastrack.service.DeviceProvisioningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
@Tag(name = "Device Provisioning", description = "IoT device credential retrieval endpoints")
public class DeviceProvisioningController {

    private final DeviceProvisioningService deviceProvisioningService;
    private final DevicePingLogService devicePingLogService;

    @GetMapping("/{serialNumber}/credentials")
    @Operation(
            summary = "Get device credentials",
            description = "Retrieves IoT Core MQTT credentials for a provisioned ESP32 device. " +
                    "Always logs the ping regardless of whether the device is registered."
    )
    public ResponseEntity<DeviceProvisioningResponse> getCredentials(
            @PathVariable String serialNumber,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = extractIpAddress(httpRequest);
        devicePingLogService.ping(serialNumber, ipAddress);

        DeviceProvisioningResponse response = deviceProvisioningService.getCredentials(serialNumber);
        return ResponseEntity.ok(response);
    }

    private String extractIpAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
