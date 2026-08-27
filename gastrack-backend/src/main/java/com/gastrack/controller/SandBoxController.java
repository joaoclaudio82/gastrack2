package com.gastrack.controller;

import com.gastrack.dto.pressure.PaginatedPressureResponse;
import com.gastrack.dto.pressure.PressureFilterParams;
import com.gastrack.service.PressureReadingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "api/v1/sandbox")
@RequiredArgsConstructor
@Tag(name = "Tests")
public class SandBoxController {

    private final PressureReadingService pressureReadingService;

    @PostMapping("/load")
    public ResponseEntity<PaginatedPressureResponse> connection() {
        PressureFilterParams filters = PressureFilterParams.builder()
                .deviceId("4036EB1815AC")
                .build();

        PaginatedPressureResponse response = pressureReadingService.getPressureReadings(filters);
        return ResponseEntity.ok(response);
    }
}
