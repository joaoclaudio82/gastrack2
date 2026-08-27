package com.gastrack.controller;

import com.gastrack.dto.refill.RefillEventResponse;
import com.gastrack.dto.refill.RefillRequest;
import com.gastrack.service.RefillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gas-points")
@RequiredArgsConstructor
@Tag(name = "Refills", description = "Gas point refill events (bottle swaps)")
public class RefillController {

    private final RefillService refillService;

    @PostMapping("/{id}/refill")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Register a bottle swap", description = "Creates the new cylinder on the point, retires the old ones, and records a MANUAL refill event")
    public ResponseEntity<RefillEventResponse> registerRefill(
            @PathVariable Long id,
            @Valid @RequestBody RefillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(refillService.registerRefill(id, request));
    }

    @GetMapping("/{id}/refills")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Refill history", description = "Refill events for a gas point, newest first")
    public ResponseEntity<List<RefillEventResponse>> findByGasPoint(@PathVariable Long id) {
        return ResponseEntity.ok(refillService.findByGasPoint(id));
    }
}
