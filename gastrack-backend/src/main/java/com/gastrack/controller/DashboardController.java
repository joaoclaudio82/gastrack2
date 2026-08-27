package com.gastrack.controller;

import com.gastrack.dto.DashboardStatsResponse;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.TenantSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics")
public class DashboardController {

    private final CompanyRepository companyRepository;
    private final ContractRepository contractRepository;
    private final EquipmentKitRepository equipmentKitRepository;
    private final EquipmentRepository equipmentRepository;
    private final PontoGasRepository pontoGasRepository;
    private final TenantSecurityService tenantSecurityService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get dashboard statistics", description = "Returns aggregated counts for dashboard cards. SUPER_ADMIN sees global stats, others see company-scoped stats.")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        DashboardStatsResponse stats;

        if (tenantSecurityService.isSuperAdmin()) {
            stats = DashboardStatsResponse.builder()
                    .activeCompanies(companyRepository.countByActiveTrue())
                    .activeGasPoints(pontoGasRepository.countByActiveTrue())
                    .activeContracts(contractRepository.countByActiveTrue())
                    .activeKits(equipmentKitRepository.countByActiveTrue())
                    .totalEquipments(equipmentRepository.count())
                    .build();
        } else {
            Long companyId = TenantContext.getCurrentCompanyId();
            stats = DashboardStatsResponse.builder()
                    // Sem contagem de empresas: para quem opera uma só, o número era o
                    // literal 1 e não respondia pergunta nenhuma. A métrica útil é a linha de gás.
                    .activeGasPoints(pontoGasRepository.countByAddressCompanyIdAndActiveTrue(companyId))
                    .activeContracts(contractRepository.countByCompanyIdAndActiveTrue(companyId))
                    .activeKits(equipmentKitRepository.countActiveByCompanyId(companyId))
                    .totalEquipments(equipmentRepository.countActiveByCompanyId(companyId))
                    .build();
        }

        return ResponseEntity.ok(stats);
    }
}
