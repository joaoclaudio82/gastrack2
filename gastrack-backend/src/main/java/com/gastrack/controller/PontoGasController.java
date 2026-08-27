package com.gastrack.controller;

import com.gastrack.dto.pontogas.PontoGasMonitoringResponse;
import com.gastrack.dto.pontogas.PontoGasRequest;
import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.dto.pontogas.PontoGasStatusUpdateRequest;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.service.PontoGasService;
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
@RequestMapping("/api/v1/gas-points")
@RequiredArgsConstructor
@Tag(name = "Gas Points", description = "Gas point management endpoints (tenant-scoped)")
public class PontoGasController {

    private final PontoGasService pontoGasService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'USER')")
    @Operation(summary = "List gas points", description = "List gas points for current company (or all for SUPER_ADMIN). Filter by addressId for analytics navigation.")
    public ResponseEntity<Page<PontoGasResponse>> findAll(
            @RequestParam(required = false) Long addressId,
            @RequestParam(required = false) Long kitId,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (kitId != null && addressId == null) {
            throw new BusinessException("Filtering by kit requires an addressId parameter");
        }
        if (addressId != null && kitId != null) {
            return ResponseEntity.ok(pontoGasService.findByAddressIdAndKitId(addressId, kitId, active, pageable));
        }
        if (addressId != null) {
            return ResponseEntity.ok(pontoGasService.findByAddressId(addressId, active, pageable));
        }
        return ResponseEntity.ok(pontoGasService.findAll(active, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get gas point by ID", description = "Get a specific gas point by its ID")
    public ResponseEntity<PontoGasResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(pontoGasService.findById(id));
    }

    @GetMapping("/{id}/monitoring")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'USER')")
    @Operation(summary = "Monitor gas point", description = "Client-facing monitoring view: fill %, last reading and SEM_SINAL when the reading is stale.")
    public ResponseEntity<PontoGasMonitoringResponse> getMonitoring(@PathVariable Long id) {
        return ResponseEntity.ok(pontoGasService.getMonitoring(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create gas point", description = "Create a new gas point for an address")
    public ResponseEntity<PontoGasResponse> create(@Valid @RequestBody PontoGasRequest request) {
        PontoGasResponse response = pontoGasService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Push pressure reading", description = "Update gas point pressure; fill and status are derived")
    public ResponseEntity<PontoGasResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody PontoGasStatusUpdateRequest request) {
        return ResponseEntity.ok(pontoGasService.updateStatus(id, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update gas point", description = "Update an existing gas point")
    public ResponseEntity<PontoGasResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PontoGasRequest request) {
        return ResponseEntity.ok(pontoGasService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Deactivate gas point", description = "Soft delete a gas point (deactivate)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        pontoGasService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/hard-delete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Hard delete gas point", description = "Permanently delete a gas point and its related equipments")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pontoGasService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Activate gas point", description = "Reactivate a deactivated gas point")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        pontoGasService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
