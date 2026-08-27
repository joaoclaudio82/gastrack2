package com.gastrack.repository;

import com.gastrack.model.Company;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CompanyRepositoryTest {

    @Autowired
    private CompanyRepository companyRepository;

    private Company testCompany;

    @BeforeEach
    void setUp() {
        testCompany = Company.builder()
            .name("Test Company")
            .slug("test-company")
            .cnpj("12.345.678/0001-90")
            .active(true)
            .build();
    }

    @Test
    void should_SaveCompany_When_ValidData() {
        Company saved = companyRepository.save(testCompany);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Test Company");
        assertThat(saved.getSlug()).isEqualTo("test-company");
        assertThat(saved.getActive()).isTrue();
    }

    @Test
    void should_FindBySlug_When_Exists() {
        companyRepository.save(testCompany);

        Optional<Company> found = companyRepository.findBySlug("test-company");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test Company");
    }

    @Test
    void should_ReturnEmpty_When_SlugNotExists() {
        Optional<Company> found = companyRepository.findBySlug("nonexistent-slug");

        assertThat(found).isEmpty();
    }

    @Test
    void should_FindByCnpj_When_Exists() {
        companyRepository.save(testCompany);

        Optional<Company> found = companyRepository.findByCnpj("12.345.678/0001-90");

        assertThat(found).isPresent();
        assertThat(found.get().getSlug()).isEqualTo("test-company");
    }

    @Test
    void should_ReturnTrue_When_SlugExists() {
        companyRepository.save(testCompany);

        boolean exists = companyRepository.existsBySlug("test-company");

        assertThat(exists).isTrue();
    }

    @Test
    void should_ReturnFalse_When_SlugNotExists() {
        boolean exists = companyRepository.existsBySlug("nonexistent");

        assertThat(exists).isFalse();
    }

    @Test
    void should_ReturnTrue_When_CnpjExists() {
        companyRepository.save(testCompany);

        boolean exists = companyRepository.existsByCnpj("12.345.678/0001-90");

        assertThat(exists).isTrue();
    }

    @Test
    void should_FindByActive_When_MultipleCompanies() {
        Company activeCompany = Company.builder()
            .name("Active Company")
            .slug("active-co")
            .cnpj("11.111.111/1111-11")
            .active(true)
            .build();
        Company inactiveCompany = Company.builder()
            .name("Inactive Company")
            .slug("inactive-co")
            .cnpj("22.222.222/2222-22")
            .active(false)
            .build();
        companyRepository.save(activeCompany);
        companyRepository.save(inactiveCompany);

        Page<Company> activeCompanies = companyRepository.findByActive(true, PageRequest.of(0, 10));

        assertThat(activeCompanies.getContent()).hasSize(1);
        assertThat(activeCompanies.getContent().get(0).getSlug()).isEqualTo("active-co");
    }

    @Test
    void should_FindAll_WithPagination() {
        for (int i = 1; i <= 15; i++) {
            Company company = Company.builder()
                .name("Company " + i)
                .slug("company-" + i)
                .cnpj(String.format("%02d.000.000/%04d-00", i % 100, i))
                .active(true)
                .build();
            companyRepository.save(company);
        }

        Page<Company> firstPage = companyRepository.findAll(PageRequest.of(0, 10));
        Page<Company> secondPage = companyRepository.findAll(PageRequest.of(1, 10));

        assertThat(firstPage.getContent()).hasSize(10);
        assertThat(secondPage.getContent()).hasSize(5);
        assertThat(firstPage.getTotalElements()).isEqualTo(15);
    }
}
