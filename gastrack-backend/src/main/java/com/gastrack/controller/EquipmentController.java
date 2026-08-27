package com.gastrack.controller;

import com.gastrack.dto.equipment.*;
import com.gastrack.model.EquipmentCondition;
import java.util.List;
import com.gastrack.service.EquipmentService;
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
@RequestMapping("/api/v1/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipment", description = "Equipment management endpoints")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all equipment", description = "List equipment with pagination (tenant-filtered for ADMIN/USER)")
    public ResponseEntity<Page<EquipmentResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String assignment,
            @RequestParam(required = false) EquipmentCondition condition,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) Long kitId,
            @RequestParam(required = false) Long companyId) {
        return ResponseEntity.ok(equipmentService.findAll(pageable, assignment, condition, typeId, kitId, companyId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment by ID", description = "Get a specific equipment by its ID")
    public ResponseEntity<EquipmentResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.findById(id));
    }

    @GetMapping("/unassigned")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List unassigned equipment", description = "List equipment not assigned to any kit (SUPER_ADMIN only)")
    public ResponseEntity<Page<EquipmentResponse>> findUnassigned(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentService.findUnassigned(pageable));
    }

    @GetMapping("/by-kit/{kitId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment by kit", description = "Get equipment for a specific kit")
    public ResponseEntity<Page<EquipmentResponse>> findByKit(
            @PathVariable Long kitId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentService.findByKit(kitId, pageable));
    }

    @GetMapping("/by-type/{typeId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment by type", description = "Get equipment of a specific type")
    public ResponseEntity<Page<EquipmentResponse>> findByType(
            @PathVariable Long typeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentService.findByType(typeId, pageable));
    }

    @GetMapping("/kits/{kitId}/sensor-options")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get sensor options for kit", description = "Returns (ESP32, port 1-8) options for associating sensors to a gas point")
    public ResponseEntity<List<SensorOptionResponse>> getSensorOptionsForKit(@PathVariable Long kitId) {
        return ResponseEntity.ok(equipmentService.getSensorOptionsForKit(kitId));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create equipment", description = "Create a new equipment item (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody EquipmentRequest request) {
        EquipmentResponse response = equipmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update equipment", description = "Update an existing equipment item (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.update(id, request));
    }

    @PatchMapping("/{id}/assign-kit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Assign equipment to kit", description = "Assign an unassigned equipment to a kit (ADMIN+ only)")
    public ResponseEntity<EquipmentResponse> assignToKit(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentAssignRequest request) {
        return ResponseEntity.ok(equipmentService.assignToKit(id, request));
    }

    @PostMapping("/batch/assign-kit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Batch assign equipment to kit", description = "Assign multiple equipment items to a kit at once (ADMIN+ only)")
    public ResponseEntity<EquipmentBatchAssignResponse> assignBatchToKit(
            @Valid @RequestBody EquipmentBatchAssignRequest request) {
        return ResponseEntity.ok(equipmentService.assignMultipleToKit(request));
    }

    @PatchMapping("/{id}/remove-from-kit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Remove equipment from kit", description = "Remove equipment from its current kit (ADMIN+ only)")
    public ResponseEntity<EquipmentResponse> removeFromKit(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.removeFromKit(id));
    }

    @PatchMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Transfer equipment between kits", description = "Transfer equipment from one kit to another (ADMIN+ only)")
    public ResponseEntity<EquipmentResponse> transfer(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentTransferRequest request) {
        return ResponseEntity.ok(equipmentService.transfer(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate equipment", description = "Soft delete an equipment item (SUPER_ADMIN only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        equipmentService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate equipment", description = "Reactivate a deactivated equipment item (SUPER_ADMIN only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        equipmentService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
