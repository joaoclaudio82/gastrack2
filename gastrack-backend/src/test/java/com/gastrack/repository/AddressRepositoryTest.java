package com.gastrack.repository;

import com.gastrack.TestDataFactory;
import com.gastrack.model.Address;
import com.gastrack.model.City;
import com.gastrack.model.Company;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AddressRepositoryTest {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TestDataFactory testDataFactory;

    private Company testCompany;
    private City testCity;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        testCompany = companyRepository.save(Company.builder()
            .name("Test Company")
            .slug("test-company")
            .cnpj("11.111.111/1111-11")
            .active(true)
            .build());

        testCity = testDataFactory.getOrCreateSaoPauloCity();

        testAddress = Address.builder()
            .company(testCompany)
            .name("Filial Centro")
            .street("Rua Principal")
            .number("100")
            .neighborhood("Centro")
            .city(testCity)
            .zipCode("01000-000")
            .active(true)
            .build();
    }

    @Test
    void should_SaveAddress_When_ValidData() {
        Address saved = addressRepository.save(testAddress);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Filial Centro");
        assertThat(saved.getCompany().getId()).isEqualTo(testCompany.getId());
    }

    @Test
    void should_FindByCompanyId_When_AddressesExist() {
        addressRepository.save(testAddress);

        Address secondAddress = Address.builder()
            .company(testCompany)
            .name("Filial Norte")
            .street("Av. Norte")
            .city(testCity)
            .zipCode("02000-000")
            .active(true)
            .build();
        addressRepository.save(secondAddress);

        List<Address> addresses = addressRepository.findByCompanyId(testCompany.getId());

        assertThat(addresses).hasSize(2);
        assertThat(addresses).extracting(Address::getName)
            .containsExactlyInAnyOrder("Filial Centro", "Filial Norte");
    }

    @Test
    void should_ReturnEmpty_When_NoAddressesForCompany() {
        Company otherCompany = companyRepository.save(Company.builder()
            .name("Other Company")
            .slug("other-company")
            .cnpj("22.222.222/2222-22")
            .active(true)
            .build());

        List<Address> addresses = addressRepository.findByCompanyId(otherCompany.getId());

        assertThat(addresses).isEmpty();
    }

    @Test
    void should_FindByCompanyIdAndActive_When_Mixed() {
        addressRepository.save(testAddress);

        Address inactiveAddress = Address.builder()
            .company(testCompany)
            .name("Filial Inativa")
            .street("Rua Fechada")
            .city(testCity)
            .zipCode("03000-000")
            .active(false)
            .build();
        addressRepository.save(inactiveAddress);

        List<Address> activeAddresses = addressRepository.findByCompanyIdAndActive(testCompany.getId(), true);

        assertThat(activeAddresses).hasSize(1);
        assertThat(activeAddresses.get(0).getName()).isEqualTo("Filial Centro");
    }

    @Test
    void should_FindByCompanyId_WithPagination() {
        for (int i = 1; i <= 15; i++) {
            Address address = Address.builder()
                .company(testCompany)
                .name("Filial " + i)
                .street("Rua " + i)
                .city(testCity)
                .zipCode("0" + i + "000-000")
                .active(true)
                .build();
            addressRepository.save(address);
        }

        Page<Address> firstPage = addressRepository.findByCompanyId(testCompany.getId(), PageRequest.of(0, 10));

        assertThat(firstPage.getContent()).hasSize(10);
        assertThat(firstPage.getTotalElements()).isEqualTo(15);
    }

    @Test
    void should_FindByIdAndCompanyId_When_BothMatch() {
        Address saved = addressRepository.save(testAddress);

        var found = addressRepository.findByIdAndCompanyId(saved.getId(), testCompany.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Filial Centro");
    }

    @Test
    void should_ReturnEmpty_When_AddressBelongsToDifferentCompany() {
        Address saved = addressRepository.save(testAddress);
        Company otherCompany = companyRepository.save(Company.builder()
            .name("Other Company")
            .slug("other-company")
            .cnpj("22.222.222/2222-22")
            .active(true)
            .build());

        var found = addressRepository.findByIdAndCompanyId(saved.getId(), otherCompany.getId());

        assertThat(found).isEmpty();
    }
}
