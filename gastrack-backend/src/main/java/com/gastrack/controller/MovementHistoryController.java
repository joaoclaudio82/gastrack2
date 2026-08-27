package com.gastrack.controller;

import com.gastrack.dto.movementhistory.MovementHistoryResponse;
import com.gastrack.model.MovementOperation;
import com.gastrack.service.MovementHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/movement-history")
@RequiredArgsConstructor
@Tag(name = "Movement History", description = "Movement history endpoints (read-only audit trail)")
public class MovementHistoryController {

    private final MovementHistoryService movementHistoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all movement history", description = "List all movement history with pagination (tenant-filtered)")
    public ResponseEntity<Page<MovementHistoryResponse>> findAll(
            @PageableDefault(size = 20, sort = "operationAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(movementHistoryService.findAll(pageable));
    }

    @GetMapping("/by-equipment/{equipmentId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get history by equipment", description = "Get movement history for a specific equipment")
    public ResponseEntity<Page<MovementHistoryResponse>> findByEquipment(
            @PathVariable Long equipmentId,
            @PageableDefault(size = 20, sort = "operationAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(movementHistoryService.findByEquipment(equipmentId, pageable));
    }

    @GetMapping("/by-kit/{kitId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get history by kit", description = "Get movement history for a specific equipment kit")
    public ResponseEntity<Page<MovementHistoryResponse>> findByKit(
            @PathVariable Long kitId,
            @RequestParam(required = false) MovementOperation operation,
            @PageableDefault(size = 20, sort = "operationAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(movementHistoryService.findByKit(kitId, operation, pageable));
    }
}
