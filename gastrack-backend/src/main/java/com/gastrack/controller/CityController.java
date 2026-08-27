package com.gastrack.controller;

import com.gastrack.dto.city.CityRequest;
import com.gastrack.dto.city.CityResponse;
import com.gastrack.service.CityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cities")
@RequiredArgsConstructor
@Tag(name = "Cities", description = "City management endpoints (global data)")
public class CityController {

    private final CityService cityService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all cities", description = "List all active cities (paginated), optionally filtered by state")
    public ResponseEntity<Page<CityResponse>> findAll(
            @RequestParam(required = false) Long stateId,
            @PageableDefault(size = 50, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        if (stateId != null) {
            return ResponseEntity.ok(cityService.findByStateId(stateId, pageable));
        }
        return ResponseEntity.ok(cityService.findAll(pageable));
    }

    @GetMapping("/state/{stateId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List cities by state", description = "List all active cities for a specific state")
    public ResponseEntity<List<CityResponse>> findByStateId(@PathVariable Long stateId) {
        return ResponseEntity.ok(cityService.findByStateId(stateId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get city by ID", description = "Get a specific city by its ID")
    public ResponseEntity<CityResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(cityService.findById(id));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get city by code", description = "Get a city by its IBGE code")
    public ResponseEntity<CityResponse> findByCode(@PathVariable String code) {
        return ResponseEntity.ok(cityService.findByCode(code));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Search cities by name", description = "Search cities by name, optionally within a state")
    public ResponseEntity<List<CityResponse>> searchByName(
            @RequestParam String name,
            @RequestParam(required = false) Long stateId) {
        if (stateId != null) {
            return ResponseEntity.ok(cityService.searchByNameInState(stateId, name));
        }
        return ResponseEntity.ok(cityService.searchByName(name));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create city", description = "Create a new city (SUPER_ADMIN only)")
    public ResponseEntity<CityResponse> create(@Valid @RequestBody CityRequest request) {
        CityResponse response = cityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update city", description = "Update an existing city (SUPER_ADMIN only)")
    public ResponseEntity<CityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CityRequest request) {
        return ResponseEntity.ok(cityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate city", description = "Soft delete a city (SUPER_ADMIN only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        cityService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate city", description = "Reactivate a deactivated city (SUPER_ADMIN only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        cityService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
