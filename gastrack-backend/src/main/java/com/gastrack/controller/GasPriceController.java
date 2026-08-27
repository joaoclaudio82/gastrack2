package com.gastrack.controller;

import com.gastrack.dto.gasprice.GasPriceRequest;
import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.service.GasPriceService;
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
@RequestMapping("/api/v1/gas-prices")
@RequiredArgsConstructor
@Tag(name = "Gas Prices", description = "Versioned, append-only gas prices per company")
public class GasPriceController {

    private final GasPriceService gasPriceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List gas prices by company", description = "All price versions for a company, newest first")
    public ResponseEntity<List<GasPriceResponse>> findByCompany(@RequestParam Long companyId) {
        return ResponseEntity.ok(gasPriceService.findByCompany(companyId));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create gas price", description = "Inserts a new price version (append-only)")
    public ResponseEntity<GasPriceResponse> create(@Valid @RequestBody GasPriceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gasPriceService.create(request));
    }
}
