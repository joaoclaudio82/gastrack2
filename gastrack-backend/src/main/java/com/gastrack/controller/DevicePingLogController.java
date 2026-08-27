package com.gastrack.controller;

import com.gastrack.dto.device.DevicePingLogResponse;
import com.gastrack.service.DevicePingLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/device-ping-logs")
@RequiredArgsConstructor
@Tag(name = "Device Ping Logs", description = "View device ping history (SUPER_ADMIN only)")
public class DevicePingLogController {

    private final DevicePingLogService devicePingLogService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "List device ping logs",
            description = "Returns paginated device ping logs with optional filters. SUPER_ADMIN only."
    )
    public ResponseEntity<Page<DevicePingLogResponse>> list(
            // Sem sort default: a query nativa do repositório já ordena por pinged_at DESC.
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String serial,
            @RequestParam(defaultValue = "false") boolean unregistered
    ) {
        Page<DevicePingLogResponse> page = devicePingLogService.list(pageable, serial, unregistered);
        return ResponseEntity.ok(page);
    }
}
