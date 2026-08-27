package com.gastrack.service;

import com.gastrack.TestDataFactory;
import com.gastrack.model.*;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.repository.CylinderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Company cascade deactivation functionality.
 * These tests verify that when a company is deactivated:
 * 1. All its addresses are also deactivated
 * 2. All cylinders belonging to those addresses are deactivated
 * 3. The cascade does not affect other companies
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Company Cascade Deactivation Tests")
class CompanyCascadeDeactivationTest {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CylinderRepository cylinderRepository;

    @Autowired
    private CylinderModelRepository cylinderModelRepository;

    @Autowired
    private TestDataFactory testDataFactory;

    private CylinderModel testModel;

    private Company companyA;
    private Company companyB;
    private Address addressA1;
    private Address addressA2;
    private Address addressB1;
    private Cylinder cylinderA1a;
    private Cylinder cylinderA1b;
    private Cylinder cylinderA2a;
    private Cylinder cylinderB1a;
    private City testCitySP;
    private City testCityRJ;

    @BeforeEach
    void setUp() {
        // Create test cities
        testCitySP = testDataFactory.getOrCreateSaoPauloCity();
        testCityRJ = testDataFactory.getOrCreateRioDeJaneiroCity();

        testModel = cylinderModelRepository.save(CylinderModel.builder()
            .codigo("O2-50L-200BAR").gasType(GasType.O2)
            .waterVolumeLiters(BigDecimal.valueOf(50)).capacityBar(BigDecimal.valueOf(200))
            .active(true).build());

        // Create Company A with 2 addresses and 3 cylinders
        companyA = companyRepository.save(Company.builder()
            .name("Company A")
            .slug("company-a")
            .cnpj("12.345.678/0001-90")
            .active(true)
            .build());

        addressA1 = addressRepository.save(Address.builder()
            .company(companyA)
            .name("Address A1")
            .street("Street A1")
            .city(testCitySP)
            .zipCode("01000-000")
            .active(true)
            .build());

        addressA2 = addressRepository.save(Address.builder()
            .company(companyA)
            .name("Address A2")
            .street("Street A2")
            .city(testCitySP)
            .zipCode("02000-000")
            .active(true)
            .build());

        cylinderA1a = cylinderRepository.save(Cylinder.builder()
            .address(addressA1)
            .company(companyA)
            .cylinderModel(testModel)
            .serialNumber("SERIAL-A1A")
            .active(true)
            .build());

        cylinderA1b = cylinderRepository.save(Cylinder.builder()
            .address(addressA1)
            .company(companyA)
            .cylinderModel(testModel)
            .serialNumber("SERIAL-A1B")
            .active(true)
            .build());

        cylinderA2a = cylinderRepository.save(Cylinder.builder()
            .address(addressA2)
            .company(companyA)
            .cylinderModel(testModel)
            .serialNumber("SERIAL-A2A")
            .active(true)
            .build());

        // Create Company B with 1 address and 1 cylinder (should NOT be affected)
        companyB = companyRepository.save(Company.builder()
            .name("Company B")
            .slug("company-b")
            .cnpj("98.765.432/0001-00")
            .active(true)
            .build());

        addressB1 = addressRepository.save(Address.builder()
            .company(companyB)
            .name("Address B1")
            .street("Street B1")
            .city(testCityRJ)
            .zipCode("20000-000")
            .active(true)
            .build());

        cylinderB1a = cylinderRepository.save(Cylinder.builder()
            .address(addressB1)
            .company(companyB)
            .cylinderModel(testModel)
            .serialNumber("SERIAL-B1A")
            .active(true)
            .build());
    }

    @Nested
    @DisplayName("When deactivating a company")
    class DeactivateCompany {

        @Test
        @DisplayName("should deactivate the company itself")
        void should_DeactivateCompany() {
            // Act
            companyService.deactivate(companyA.getId());

            // Assert
            Company reloaded = companyRepository.findById(companyA.getId()).orElseThrow();
            assertThat(reloaded.getActive()).isFalse();
        }

        @Test
        @DisplayName("should deactivate all addresses belonging to the company")
        void should_DeactivateAllAddresses() {
            // Act
            companyService.deactivate(companyA.getId());

            // Assert
            Address reloadedA1 = addressRepository.findById(addressA1.getId()).orElseThrow();
            Address reloadedA2 = addressRepository.findById(addressA2.getId()).orElseThrow();

            assertThat(reloadedA1.getActive()).isFalse();
            assertThat(reloadedA2.getActive()).isFalse();
        }

        @Test
        @DisplayName("should deactivate all cylinders belonging to the company's addresses")
        void should_DeactivateAllCylinders() {
            // Act
            companyService.deactivate(companyA.getId());

            // Assert
            Cylinder reloadedA1a = cylinderRepository.findById(cylinderA1a.getId()).orElseThrow();
            Cylinder reloadedA1b = cylinderRepository.findById(cylinderA1b.getId()).orElseThrow();
            Cylinder reloadedA2a = cylinderRepository.findById(cylinderA2a.getId()).orElseThrow();

            assertThat(reloadedA1a.getActive()).isFalse();
            assertThat(reloadedA1b.getActive()).isFalse();
            assertThat(reloadedA2a.getActive()).isFalse();
        }

        @Test
        @DisplayName("should NOT affect other companies")
        void should_NotAffectOtherCompanies() {
            // Act
            companyService.deactivate(companyA.getId());

            // Assert - Company B and its data should remain active
            Company reloadedB = companyRepository.findById(companyB.getId()).orElseThrow();
            Address reloadedB1 = addressRepository.findById(addressB1.getId()).orElseThrow();
            Cylinder reloadedB1a = cylinderRepository.findById(cylinderB1a.getId()).orElseThrow();

            assertThat(reloadedB.getActive()).isTrue();
            assertThat(reloadedB1.getActive()).isTrue();
            assertThat(reloadedB1a.getActive()).isTrue();
        }

        @Test
        @DisplayName("should handle company with no addresses gracefully")
        void should_HandleCompanyWithNoAddresses() {
            // Arrange
            Company emptyCompany = companyRepository.save(Company.builder()
                .name("Empty Company")
                .slug("empty-company")
                .cnpj("00.000.000/0003-00")
                .active(true)
                .build());

            // Act
            companyService.deactivate(emptyCompany.getId());

            // Assert
            Company reloaded = companyRepository.findById(emptyCompany.getId()).orElseThrow();
            assertThat(reloaded.getActive()).isFalse();
        }

        @Test
        @DisplayName("should handle addresses with no cylinders gracefully")
        void should_HandleAddressesWithNoCylinders() {
            // Arrange
            Company companyC = companyRepository.save(Company.builder()
                .name("Company C")
                .slug("company-c")
                .cnpj("00.000.000/0004-00")
                .active(true)
                .build());

            Address addressC1 = addressRepository.save(Address.builder()
                .company(companyC)
                .name("Address C1")
                .street("Street C1")
                .city(testCitySP)
                .zipCode("30000-000")
                .active(true)
                .build());

            // Act
            companyService.deactivate(companyC.getId());

            // Assert
            Company reloadedC = companyRepository.findById(companyC.getId()).orElseThrow();
            Address reloadedC1 = addressRepository.findById(addressC1.getId()).orElseThrow();

            assertThat(reloadedC.getActive()).isFalse();
            assertThat(reloadedC1.getActive()).isFalse();
        }

        @Test
        @DisplayName("should skip already inactive addresses and cylinders")
        void should_SkipAlreadyInactiveEntities() {
            // Arrange - Deactivate one address and one cylinder before company deactivation
            addressA2.setActive(false);
            addressRepository.save(addressA2);

            cylinderA1b.setActive(false);
            cylinderRepository.save(cylinderA1b);

            // Act
            companyService.deactivate(companyA.getId());

            // Assert - All should be inactive now
            List<Address> addresses = addressRepository.findByCompanyId(companyA.getId());
            List<Cylinder> cylinders = cylinderRepository.findByAddressCompanyId(companyA.getId());

            assertThat(addresses).allMatch(a -> !a.getActive());
            assertThat(cylinders).allMatch(c -> !c.getActive());
        }
    }

    @Nested
    @DisplayName("When activating a company")
    class ActivateCompany {

        @Test
        @DisplayName("should activate only the company, not addresses or cylinders")
        void should_ActivateOnlyCompany() {
            // Arrange - First deactivate everything
            companyService.deactivate(companyA.getId());

            // Act - Activate the company
            companyService.activate(companyA.getId());

            // Assert - Company is active, but addresses and cylinders remain inactive
            Company reloaded = companyRepository.findById(companyA.getId()).orElseThrow();
            assertThat(reloaded.getActive()).isTrue();

            List<Address> addresses = addressRepository.findByCompanyId(companyA.getId());
            List<Cylinder> cylinders = cylinderRepository.findByAddressCompanyId(companyA.getId());

            // Addresses and cylinders should still be inactive (cascade activation is NOT automatic)
            assertThat(addresses).allMatch(a -> !a.getActive());
            assertThat(cylinders).allMatch(c -> !c.getActive());
        }
    }

    @Nested
    @DisplayName("Data isolation verification")
    class DataIsolation {

        @Test
        @DisplayName("should verify complete data isolation between companies")
        void should_VerifyDataIsolation() {
            // Arrange - Both companies start active
            assertThat(companyA.getActive()).isTrue();
            assertThat(companyB.getActive()).isTrue();

            // Act - Deactivate Company A
            companyService.deactivate(companyA.getId());

            // Assert - Company A hierarchy is fully deactivated
            Company reloadedA = companyRepository.findById(companyA.getId()).orElseThrow();
            assertThat(reloadedA.getActive()).isFalse();
            assertThat(addressRepository.findByCompanyIdAndActive(companyA.getId(), true)).isEmpty();
            assertThat(cylinderRepository.findByAddressCompanyId(companyA.getId())
                .stream().filter(Cylinder::getActive).toList()).isEmpty();

            // Assert - Company B hierarchy is completely unaffected
            Company reloadedB = companyRepository.findById(companyB.getId()).orElseThrow();
            assertThat(reloadedB.getActive()).isTrue();
            assertThat(addressRepository.findByCompanyIdAndActive(companyB.getId(), true)).hasSize(1);
            assertThat(cylinderRepository.findByAddressCompanyId(companyB.getId())
                .stream().filter(Cylinder::getActive).toList()).hasSize(1);
        }

        @Test
        @DisplayName("should count deactivated entities correctly")
        void should_CountDeactivatedEntities() {
            // Arrange - Verify initial state
            long initialActiveAddressesA = addressRepository.findByCompanyIdAndActive(companyA.getId(), true).size();
            long initialActiveCylindersA = cylinderRepository.findByAddressCompanyId(companyA.getId())
                .stream().filter(Cylinder::getActive).count();

            assertThat(initialActiveAddressesA).isEqualTo(2);
            assertThat(initialActiveCylindersA).isEqualTo(3);

            // Act
            companyService.deactivate(companyA.getId());

            // Assert
            long finalActiveAddressesA = addressRepository.findByCompanyIdAndActive(companyA.getId(), true).size();
            long finalActiveCylindersA = cylinderRepository.findByAddressCompanyId(companyA.getId())
                .stream().filter(Cylinder::getActive).count();

            assertThat(finalActiveAddressesA).isZero();
            assertThat(finalActiveCylindersA).isZero();
        }
    }
}
