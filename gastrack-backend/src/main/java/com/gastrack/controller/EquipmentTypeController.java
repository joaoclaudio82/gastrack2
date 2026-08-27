package com.gastrack.controller;

import com.gastrack.dto.equipmenttype.EquipmentTypeRequest;
import com.gastrack.dto.equipmenttype.EquipmentTypeResponse;
import com.gastrack.service.EquipmentTypeService;
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
@RequestMapping("/api/v1/equipment-types")
@RequiredArgsConstructor
@Tag(name = "Equipment Types", description = "Equipment type management endpoints")
public class EquipmentTypeController {

    private final EquipmentTypeService equipmentTypeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all equipment types", description = "List all equipment types with pagination")
    public ResponseEntity<Page<EquipmentTypeResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentTypeService.findAll(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List active equipment types", description = "List active equipment types with optional search by name")
    // Mesmo caso de `/companies/active`: alimenta combo, e o default de 20 esconderia tipos assim
    // que o catálogo passasse de 20 itens.
    public ResponseEntity<Page<EquipmentTypeResponse>> findAllActive(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 200, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentTypeService.searchActive(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment type by ID", description = "Get a specific equipment type by its ID")
    public ResponseEntity<EquipmentTypeResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentTypeService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create equipment type", description = "Create a new equipment type (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentTypeResponse> create(@Valid @RequestBody EquipmentTypeRequest request) {
        EquipmentTypeResponse response = equipmentTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update equipment type", description = "Update an existing equipment type (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentTypeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentTypeRequest request) {
        return ResponseEntity.ok(equipmentTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate equipment type", description = "Soft delete an equipment type (SUPER_ADMIN only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        equipmentTypeService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate equipment type", description = "Reactivate a deactivated equipment type (SUPER_ADMIN only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        equipmentTypeService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
