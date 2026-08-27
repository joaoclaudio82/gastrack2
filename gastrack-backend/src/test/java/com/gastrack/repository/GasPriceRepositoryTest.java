package com.gastrack.repository;

import com.gastrack.model.Company;
import com.gastrack.model.GasPrice;
import com.gastrack.model.GasType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GasPriceRepositoryTest {

    @Autowired
    private GasPriceRepository repository;

    @Autowired
    private CompanyRepository companyRepository;

    private Company company;

    @BeforeEach
    void setUp() {
        company = companyRepository.save(Company.builder()
            .name("Test Company")
            .slug("test-company")
            .cnpj("11.111.111/1111-11")
            .active(true)
            .build());
    }

    private GasPrice price(BigDecimal value, LocalDateTime validFrom) {
        return GasPrice.builder()
            .company(company)
            .gasType(GasType.O2)
            .pricePerM3(value)
            .currency("BRL")
            .validFrom(validFrom)
            .active(true)
            .build();
    }

    @Test
    void should_ReturnNewestVersion_When_TwoVersionsExist() {
        LocalDateTime now = LocalDateTime.now();
        repository.save(price(BigDecimal.valueOf(10.00), now.minusDays(10)));
        repository.save(price(BigDecimal.valueOf(12.50), now.minusDays(1)));

        List<GasPrice> current = repository.findCurrentByCompanyAndGasType(
            company.getId(), GasType.O2, now, PageRequest.of(0, 1));

        assertThat(current).hasSize(1);
        assertThat(current.get(0).getPricePerM3()).isEqualByComparingTo(BigDecimal.valueOf(12.50));
    }

    @Test
    void should_IgnoreFutureVersions_When_ValidFromAfterNow() {
        LocalDateTime now = LocalDateTime.now();
        repository.save(price(BigDecimal.valueOf(10.00), now.minusDays(1)));
        repository.save(price(BigDecimal.valueOf(99.00), now.plusDays(5)));

        List<GasPrice> current = repository.findCurrentByCompanyAndGasType(
            company.getId(), GasType.O2, now, PageRequest.of(0, 1));

        assertThat(current).hasSize(1);
        assertThat(current.get(0).getPricePerM3()).isEqualByComparingTo(BigDecimal.valueOf(10.00));
    }

    @Test
    void should_ReturnAllVersionsNewestFirst_When_FindByCompany() {
        LocalDateTime now = LocalDateTime.now();
        repository.save(price(BigDecimal.valueOf(10.00), now.minusDays(10)));
        repository.save(price(BigDecimal.valueOf(12.50), now.minusDays(1)));

        List<GasPrice> all = repository.findByCompanyIdOrderByValidFromDesc(company.getId());

        assertThat(all).hasSize(2);
        assertThat(all.get(0).getPricePerM3()).isEqualByComparingTo(BigDecimal.valueOf(12.50));
    }
}
