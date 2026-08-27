package com.gastrack.controller;

import com.gastrack.dto.country.CountryRequest;
import com.gastrack.dto.country.CountryResponse;
import com.gastrack.service.CountryService;
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
@RequestMapping("/api/v1/countries")
@RequiredArgsConstructor
@Tag(name = "Countries", description = "Country management endpoints (global data)")
public class CountryController {

    private final CountryService countryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all countries", description = "List all active countries")
    public ResponseEntity<List<CountryResponse>> findAll() {
        return ResponseEntity.ok(countryService.findAllActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get country by ID", description = "Get a specific country by its ID")
    public ResponseEntity<CountryResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(countryService.findById(id));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get country by code", description = "Get a country by its ISO 3166-1 alpha-2 code")
    public ResponseEntity<CountryResponse> findByCode(@PathVariable String code) {
        return ResponseEntity.ok(countryService.findByCode(code));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create country", description = "Create a new country (SUPER_ADMIN only)")
    public ResponseEntity<CountryResponse> create(@Valid @RequestBody CountryRequest request) {
        CountryResponse response = countryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update country", description = "Update an existing country (SUPER_ADMIN only)")
    public ResponseEntity<CountryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CountryRequest request) {
        return ResponseEntity.ok(countryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate country", description = "Soft delete a country (SUPER_ADMIN only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        countryService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate country", description = "Reactivate a deactivated country (SUPER_ADMIN only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        countryService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
