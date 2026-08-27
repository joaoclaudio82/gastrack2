package com.gastrack.service;

import com.gastrack.dto.gasprice.GasPriceRequest;
import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.GasPriceMapper;
import com.gastrack.model.Company;
import com.gastrack.model.GasPrice;
import com.gastrack.model.GasType;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.GasPriceRepository;
import com.gastrack.service.impl.GasPriceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GasPriceServiceImplTest {

    @Mock
    private GasPriceRepository repository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private GasPriceMapper mapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @InjectMocks
    private GasPriceServiceImpl service;

    private Company company;
    private GasPriceResponse response;

    @BeforeEach
    void setUp() {
        company = Company.builder().id(1L).name("Test Company").slug("test").cnpj("11.111.111/1111-11").active(true).build();
        response = new GasPriceResponse(1L, 1L, "Test Company", GasType.O2,
            BigDecimal.valueOf(12.50), "BRL", LocalDateTime.now(), true,
            LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void should_InsertNewRow_When_Create() {
        GasPriceRequest request = new GasPriceRequest(1L, GasType.O2, BigDecimal.valueOf(12.50), null, null);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(repository.save(any(GasPrice.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(GasPrice.class))).thenReturn(response);

        service.create(request);

        ArgumentCaptor<GasPrice> captor = ArgumentCaptor.forClass(GasPrice.class);
        verify(repository).save(captor.capture());
        GasPrice saved = captor.getValue();
        // Append-only: a fresh row (no id), active, defaults applied
        assertThat(saved.getId()).isNull();
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getCurrency()).isEqualTo("BRL");
        assertThat(saved.getValidFrom()).isNotNull();
    }

    @Test
    void should_ThrowNotFound_When_CompanyMissing() {
        GasPriceRequest request = new GasPriceRequest(99L, GasType.O2, BigDecimal.valueOf(12.50), null, null);
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(ResourceNotFoundException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void should_ReturnNewest_When_FindCurrent() {
        GasPrice newer = GasPrice.builder().id(2L).company(company).gasType(GasType.O2)
            .pricePerM3(BigDecimal.valueOf(12.50)).currency("BRL")
            .validFrom(LocalDateTime.now().minusDays(1)).active(true).build();
        when(repository.findCurrentByCompanyAndGasType(eq(1L), eq(GasType.O2), any(), any()))
            .thenReturn(List.of(newer));
        when(mapper.toResponse(newer)).thenReturn(response);

        GasPriceResponse result = service.findCurrent(1L, GasType.O2);

        assertThat(result.pricePerM3()).isEqualByComparingTo(BigDecimal.valueOf(12.50));
    }

    @Test
    void should_ThrowNotFound_When_NoCurrentPrice() {
        when(repository.findCurrentByCompanyAndGasType(eq(1L), eq(GasType.O2), any(), any()))
            .thenReturn(List.of());

        assertThatThrownBy(() -> service.findCurrent(1L, GasType.O2))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
