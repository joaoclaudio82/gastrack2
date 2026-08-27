package com.gastrack.controller;

import com.gastrack.dto.contract.ContractAddressResponse;
import com.gastrack.dto.contract.ContractAddressesUpdateRequest;
import com.gastrack.dto.contract.ContractRequest;
import com.gastrack.dto.contract.ContractResponse;
import com.gastrack.dto.contract.ContractStatusUpdateRequest;
import com.gastrack.model.ContractStatus;
import com.gastrack.service.ContractService;
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
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
@Tag(name = "Contracts", description = "Contract management endpoints")
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all contracts", description = "List contracts with pagination (tenant-filtered)")
    public ResponseEntity<Page<ContractResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) ContractStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(contractService.findAll(pageable, status, search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get contract by ID", description = "Get a specific contract by its ID")
    public ResponseEntity<ContractResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.findById(id));
    }

    @GetMapping("/by-company/{companyId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get contracts by company", description = "Get contracts for a specific company")
    public ResponseEntity<Page<ContractResponse>> findByCompany(
            @PathVariable Long companyId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(contractService.findByCompany(companyId, pageable));
    }

    @GetMapping("/by-company/{companyId}/status/{status}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get contracts by company and status", description = "Get contracts for a specific company filtered by status")
    public ResponseEntity<Page<ContractResponse>> findByCompanyAndStatus(
            @PathVariable Long companyId,
            @PathVariable ContractStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(contractService.findByCompanyAndStatus(companyId, status, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create contract", description = "Create a new contract (ADMIN+ only)")
    public ResponseEntity<ContractResponse> create(@Valid @RequestBody ContractRequest request) {
        ContractResponse response = contractService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update contract", description = "Update an existing contract (ADMIN+ only)")
    public ResponseEntity<ContractResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ContractRequest request) {
        return ResponseEntity.ok(contractService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update contract status", description = "Update the status of a contract (ADMIN+ only)")
    public ResponseEntity<ContractResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ContractStatusUpdateRequest request) {
        return ResponseEntity.ok(contractService.updateStatus(id, request));
    }

    @PutMapping("/{id}/addresses")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update contract addresses", description = "Override the list of allowed addresses for a contract (ADMIN+ only)")
    public ResponseEntity<ContractResponse> updateAddresses(
            @PathVariable Long id,
            @Valid @RequestBody ContractAddressesUpdateRequest request) {
        return ResponseEntity.ok(contractService.updateAddresses(id, request));
    }

    @GetMapping("/{id}/addresses")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List contract addresses", description = "List addresses approved for kit operations in a contract")
    public ResponseEntity<List<ContractAddressResponse>> getAddresses(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getAllowedAddresses(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Deactivate contract", description = "Soft delete a contract (ADMIN+ only)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        contractService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Activate contract", description = "Reactivate a deactivated contract (ADMIN+ only)")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        contractService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
