package com.gastrack.controller;

import com.gastrack.dto.state.StateRequest;
import com.gastrack.dto.state.StateResponse;
import com.gastrack.service.StateService;
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
@RequestMapping("/api/v1/states")
@RequiredArgsConstructor
@Tag(name = "States", description = "State management endpoints (global data)")
public class StateController {

    private final StateService stateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all states", description = "List all active states, optionally filtered by country")
    public ResponseEntity<List<StateResponse>> findAll(
            @RequestParam(required = false) Long countryId) {
        if (countryId != null) {
            return ResponseEntity.ok(stateService.findByCountryId(countryId));
        }
        return ResponseEntity.ok(stateService.findAllActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get state by ID", description = "Get a specific state by its ID")
    public ResponseEntity<StateResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(stateService.findById(id));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get state by code", description = "Get a state by its IBGE code")
    public ResponseEntity<StateResponse> findByCode(@PathVariable String code) {
        return ResponseEntity.ok(stateService.findByCode(code));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create state", description = "Create a new state (SUPER_ADMIN only)")
    public ResponseEntity<StateResponse> create(@Valid @RequestBody StateRequest request) {
        StateResponse response = stateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update state", description = "Update an existing state (SUPER_ADMIN only)")
    public ResponseEntity<StateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody StateRequest request) {
        return ResponseEntity.ok(stateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate state", description = "Soft delete a state (SUPER_ADMIN only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        stateService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate state", description = "Reactivate a deactivated state (SUPER_ADMIN only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        stateService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
