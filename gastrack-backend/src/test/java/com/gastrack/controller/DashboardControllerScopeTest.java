package com.gastrack.controller;

import com.gastrack.dto.DashboardStatsResponse;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.TenantSecurityService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regressão de produto: o card "Empresas Ativas" mostrava o literal {@code 1} para quem opera uma
 * empresa só — número que não vem de consulta nenhuma e não responde pergunta nenhuma. Quem gere
 * uma operação quer saber quantas linhas de gás tem de pé, não que a própria empresa existe.
 */
@ExtendWith(MockitoExtension.class)
class DashboardControllerScopeTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private ContractRepository contractRepository;
    @Mock private EquipmentKitRepository equipmentKitRepository;
    @Mock private EquipmentRepository equipmentRepository;
    @Mock private PontoGasRepository pontoGasRepository;
    @Mock private TenantSecurityService tenantSecurityService;

    @InjectMocks private DashboardController controller;

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Quem opera uma empresa recebe linhas de gás, não contagem de empresas")
    void should_CountGasPointsAndSkipCompanies_When_UserIsNotSuperAdmin() {
        TenantContext.setCurrentCompanyId(352L);
        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(pontoGasRepository.countByAddressCompanyIdAndActiveTrue(352L)).thenReturn(7L);
        when(contractRepository.countByCompanyIdAndActiveTrue(352L)).thenReturn(2L);
        when(equipmentKitRepository.countActiveByCompanyId(352L)).thenReturn(3L);
        when(equipmentRepository.countActiveByCompanyId(352L)).thenReturn(9L);

        DashboardStatsResponse stats = controller.getStats().getBody();

        assertThat(stats).isNotNull();
        assertThat(stats.getActiveGasPoints()).isEqualTo(7L);
        assertThat(stats.getActiveCompanies())
            .as("nada de contar empresas para quem só tem a própria")
            .isZero();
        verify(companyRepository, never()).countByActiveTrue();
    }

    @Test
    @DisplayName("Super admin continua vendo o alcance da plataforma")
    void should_CountEveryCompany_When_UserIsSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(true);
        when(companyRepository.countByActiveTrue()).thenReturn(4L);
        when(pontoGasRepository.countByActiveTrue()).thenReturn(25L);
        when(contractRepository.countByActiveTrue()).thenReturn(6L);
        when(equipmentKitRepository.countByActiveTrue()).thenReturn(8L);
        when(equipmentRepository.count()).thenReturn(31L);

        DashboardStatsResponse stats = controller.getStats().getBody();

        assertThat(stats).isNotNull();
        assertThat(stats.getActiveCompanies()).isEqualTo(4L);
        assertThat(stats.getActiveGasPoints()).isEqualTo(25L);
    }
}
