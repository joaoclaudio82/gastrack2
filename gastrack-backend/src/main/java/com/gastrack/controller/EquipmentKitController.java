package com.gastrack.controller;

import com.gastrack.dto.equipmentkit.EquipmentKitRequest;
import com.gastrack.dto.equipmentkit.EquipmentKitResponse;
import com.gastrack.dto.equipmentkit.EquipmentKitStatusUpdateRequest;
import com.gastrack.dto.equipmentkit.SwapEspRequest;
import com.gastrack.dto.equipmentkit.SwapSensorRequest;
import com.gastrack.dto.kitinstallation.KitInstallRequest;
import com.gastrack.dto.kitinstallation.KitUninstallRequest;
import com.gastrack.model.KitStatus;
import com.gastrack.service.EquipmentKitService;
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
@RequestMapping("/api/v1/equipment-kits")
@RequiredArgsConstructor
@Tag(name = "Equipment Kits", description = "Equipment kit management endpoints")
public class EquipmentKitController {

    private final EquipmentKitService equipmentKitService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all equipment kits", description = "List equipment kits with pagination (tenant-filtered)")
    public ResponseEntity<Page<EquipmentKitResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) KitStatus status,
            @RequestParam(required = false) Long contractId) {
        return ResponseEntity.ok(equipmentKitService.findAll(pageable, status, contractId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment kit by ID", description = "Get a specific equipment kit by its ID")
    public ResponseEntity<EquipmentKitResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentKitService.findById(id));
    }

    @GetMapping("/by-contract/{contractId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment kits by contract", description = "Get equipment kits for a specific contract")
    public ResponseEntity<Page<EquipmentKitResponse>> findByContract(
            @PathVariable Long contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentKitService.findByContract(contractId, pageable));
    }

    @GetMapping("/by-company/{companyId}/status/{status}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get equipment kits by company and status", description = "Get equipment kits for a specific company filtered by status")
    public ResponseEntity<Page<EquipmentKitResponse>> findByCompanyAndStatus(
            @PathVariable Long companyId,
            @PathVariable KitStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equipmentKitService.findByCompanyAndStatus(companyId, status, pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create equipment kit", description = "Create a new equipment kit (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentKitResponse> create(@Valid @RequestBody EquipmentKitRequest request) {
        EquipmentKitResponse response = equipmentKitService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update equipment kit", description = "Update an existing equipment kit (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentKitResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentKitRequest request) {
        return ResponseEntity.ok(equipmentKitService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update equipment kit status", description = "Update the status of an equipment kit (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentKitResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentKitStatusUpdateRequest request) {
        return ResponseEntity.ok(equipmentKitService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate equipment kit", description = "Soft delete an equipment kit (SUPER_ADMIN only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        equipmentKitService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate equipment kit", description = "Reactivate a deactivated equipment kit (SUPER_ADMIN only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        equipmentKitService.activate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/install")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Install equipment kit at location", description = "Install a kit at a specific address (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentKitResponse> installKit(
            @PathVariable Long id,
            @Valid @RequestBody KitInstallRequest request) {
        return ResponseEntity.ok(equipmentKitService.installKit(id, request));
    }

    @PostMapping("/{id}/uninstall")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Uninstall equipment kit from location", description = "Remove a kit from its location and unassign all equipment (SUPER_ADMIN only)")
    public ResponseEntity<EquipmentKitResponse> uninstallKit(
            @PathVariable Long id,
            @Valid @RequestBody KitUninstallRequest request) {
        return ResponseEntity.ok(equipmentKitService.uninstallKit(id, request));
    }

    @PostMapping("/{id}/swap-esp")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Swap the kit's ESP32 gateway", description = "Maintenance: replace a dead ESP32 with one from stock; re-points sensors and reprovisions credentials (kit must be INSTALLED or MAINTENANCE)")
    public ResponseEntity<EquipmentKitResponse> swapEsp(
            @PathVariable Long id,
            @Valid @RequestBody SwapEspRequest request) {
        return ResponseEntity.ok(equipmentKitService.swapEsp(id, request));
    }

    @PostMapping("/{id}/swap-sensor")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Swap a single sensor of the kit", description = "Maintenance: replace one sensor on the same ESP port and gas point (kit must be INSTALLED or MAINTENANCE)")
    public ResponseEntity<EquipmentKitResponse> swapSensor(
            @PathVariable Long id,
            @Valid @RequestBody SwapSensorRequest request) {
        return ResponseEntity.ok(equipmentKitService.swapSensor(id, request));
    }
}
