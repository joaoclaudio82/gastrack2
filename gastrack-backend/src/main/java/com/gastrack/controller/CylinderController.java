package com.gastrack.controller;

import com.gastrack.dto.cylinder.CylinderRequest;
import com.gastrack.dto.cylinder.CylinderResponse;
import com.gastrack.service.CylinderService;
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

@RestController
@RequestMapping("/api/v1/cylinders")
@RequiredArgsConstructor
@Tag(name = "Cylinders", description = "Cylinder management endpoints (tenant-scoped)")
public class CylinderController {

    private final CylinderService cylinderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List cylinders", description = "List cylinders for current company (or all for SUPER_ADMIN)")
    public ResponseEntity<Page<CylinderResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Long addressId,
            @RequestParam(required = false) Long pontoGasId) {
        return ResponseEntity.ok(cylinderService.findAll(pageable, search, addressId, pontoGasId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get cylinder by ID", description = "Get a specific cylinder by its ID")
    public ResponseEntity<CylinderResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(cylinderService.findById(id));
    }

    @GetMapping("/by-address/{addressId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List cylinders by address", description = "List cylinders for a specific address")
    public ResponseEntity<Page<CylinderResponse>> findByAddressId(
            @PathVariable Long addressId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(cylinderService.findByAddressId(addressId, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create cylinder", description = "Create a new cylinder for an address")
    public ResponseEntity<CylinderResponse> create(@Valid @RequestBody CylinderRequest request) {
        CylinderResponse response = cylinderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update cylinder", description = "Update an existing cylinder")
    public ResponseEntity<CylinderResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CylinderRequest request) {
        return ResponseEntity.ok(cylinderService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Deactivate cylinder", description = "Soft delete a cylinder (deactivate)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        cylinderService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Activate cylinder", description = "Reactivate a deactivated cylinder")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        cylinderService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
