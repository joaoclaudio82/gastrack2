package com.gastrack.controller;

import com.gastrack.dto.company.CompanyRequest;
import com.gastrack.dto.company.CompanyResponse;
import com.gastrack.service.CompanyService;
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
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Companies", description = "Company management endpoints (SUPER_ADMIN only)")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all companies", description = "List all companies with pagination (SUPER_ADMIN only)")
    public ResponseEntity<Page<CompanyResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(companyService.findAll(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List active companies", description = "List all active companies with pagination and optional search by name")
    // `/active` alimenta combo de seleção, não listagem paginada de tela. Com o default de 20, quem
    // chamava sem `size` recebia as 20 empresas mais recentes e as demais sumiam do seletor sem
    // aviso — inclusive a empresa default do sistema. O cliente ainda pode paginar explicitamente.
    public ResponseEntity<Page<CompanyResponse>> findAllActive(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 200, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(companyService.findAllActive(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get company by ID", description = "Get a specific company by its ID")
    public ResponseEntity<CompanyResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.findById(id));
    }

    @GetMapping("/slug/{slug}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get company by slug", description = "Get a specific company by its slug")
    public ResponseEntity<CompanyResponse> findBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(companyService.findBySlug(slug));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create company", description = "Create a new company")
    public ResponseEntity<CompanyResponse> create(@Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = companyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update company", description = "Update an existing company")
    public ResponseEntity<CompanyResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate company", description = "Soft delete a company (deactivate)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        companyService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate company", description = "Reactivate a deactivated company")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        companyService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
