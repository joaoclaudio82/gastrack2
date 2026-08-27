package com.gastrack.controller;

import com.gastrack.dto.cylindermodel.CylinderModelRequest;
import com.gastrack.dto.cylindermodel.CylinderModelResponse;
import com.gastrack.service.CylinderModelService;
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
@RequestMapping("/api/v1/cylinder-models")
@RequiredArgsConstructor
@Tag(name = "Cylinder Models", description = "Global catalog of cylinder types/models")
public class CylinderModelController {

    private final CylinderModelService cylinderModelService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List cylinder models", description = "List the catalog of cylinder models (paginated)")
    public ResponseEntity<Page<CylinderModelResponse>> findAll(@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(cylinderModelService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get cylinder model by ID")
    public ResponseEntity<CylinderModelResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(cylinderModelService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create cylinder model")
    public ResponseEntity<CylinderModelResponse> create(@Valid @RequestBody CylinderModelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cylinderModelService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update cylinder model")
    public ResponseEntity<CylinderModelResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody CylinderModelRequest request) {
        return ResponseEntity.ok(cylinderModelService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate cylinder model")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        cylinderModelService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
