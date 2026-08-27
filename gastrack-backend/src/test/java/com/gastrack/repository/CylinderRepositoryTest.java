package com.gastrack.repository;

import com.gastrack.TestDataFactory;
import com.gastrack.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CylinderRepositoryTest {

    @Autowired private CylinderRepository cylinderRepository;
    @Autowired private CylinderModelRepository cylinderModelRepository;
    @Autowired private PontoGasRepository pontoGasRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private TestDataFactory testDataFactory;

    private Company testCompany;
    private Address testAddress;
    private CylinderModel testModel;
    private PontoGas testPontoGas;

    @BeforeEach
    void setUp() {
        testCompany = companyRepository.save(Company.builder()
            .name("Test Company").slug("test-company").cnpj("11.111.111/1111-11").active(true).build());

        City testCity = testDataFactory.getOrCreateSaoPauloCity();

        testAddress = addressRepository.save(Address.builder()
            .company(testCompany).name("Filial Centro").street("Rua Principal")
            .city(testCity).zipCode("01000-000").active(true).build());

        testModel = cylinderModelRepository.save(CylinderModel.builder()
            .codigo("O2-50L-200BAR").gasType(GasType.O2)
            .waterVolumeLiters(BigDecimal.valueOf(50)).capacityBar(BigDecimal.valueOf(200))
            .active(true).build());

        testPontoGas = pontoGasRepository.save(PontoGas.builder()
            .address(testAddress).location("Sala 1").active(true).build());
    }

    private Cylinder cylinder(String serial, PontoGas pontoGas, Address address) {
        return Cylinder.builder()
            .cylinderModel(testModel)
            .company(testCompany)
            .pontoGas(pontoGas)
            .address(address)
            .serialNumber(serial)
            .active(true)
            .build();
    }

    @Test
    void should_SaveCylinder_When_ModelAndPointProvided() {
        Cylinder saved = cylinderRepository.save(cylinder("SERIAL-001", testPontoGas, testAddress));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getSerialNumber()).isEqualTo("SERIAL-001");
        assertThat(saved.getCylinderModel().getId()).isEqualTo(testModel.getId());
        assertThat(saved.getPontoGas().getId()).isEqualTo(testPontoGas.getId());
    }

    @Test
    void should_SaveStockCylinder_When_PointAndAddressNull() {
        Cylinder saved = cylinderRepository.save(cylinder("SERIAL-STOCK", null, null));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getPontoGas()).isNull();
        assertThat(saved.getAddress()).isNull();
    }

    @Test
    void should_FindBySerialNumber_When_Exists() {
        cylinderRepository.save(cylinder("SERIAL-001", testPontoGas, testAddress));

        Optional<Cylinder> found = cylinderRepository.findBySerialNumber("SERIAL-001");

        assertThat(found).isPresent();
        assertThat(found.get().getCylinderModel().getGasType()).isEqualTo(GasType.O2);
    }

    @Test
    void should_ExistsBySerialNumber_ReturnFalse_When_NotExists() {
        assertThat(cylinderRepository.existsBySerialNumber("NONEXISTENT")).isFalse();
    }

    @Test
    void should_FindByAddressId_When_CylindersExist() {
        cylinderRepository.save(cylinder("SERIAL-001", testPontoGas, testAddress));
        cylinderRepository.save(cylinder("SERIAL-002", testPontoGas, testAddress));

        List<Cylinder> cylinders = cylinderRepository.findByAddressId(testAddress.getId());

        assertThat(cylinders).hasSize(2)
            .extracting(Cylinder::getSerialNumber)
            .containsExactlyInAnyOrder("SERIAL-001", "SERIAL-002");
    }

    @Test
    void should_FindByAddressId_WithPagination() {
        for (int i = 1; i <= 15; i++) {
            cylinderRepository.save(cylinder("SERIAL-" + String.format("%03d", i), testPontoGas, testAddress));
        }

        Page<Cylinder> firstPage = cylinderRepository.findByAddressId(testAddress.getId(), PageRequest.of(0, 10));

        assertThat(firstPage.getContent()).hasSize(10);
        assertThat(firstPage.getTotalElements()).isEqualTo(15);
    }

    @Test
    void should_FindByAddressCompanyId_When_CylindersExist() {
        cylinderRepository.save(cylinder("SERIAL-001", testPontoGas, testAddress));

        List<Cylinder> cylinders = cylinderRepository.findByAddressCompanyId(testCompany.getId());

        assertThat(cylinders).hasSize(1);
        assertThat(cylinders.get(0).getSerialNumber()).isEqualTo("SERIAL-001");
    }

    @Test
    void should_FindByIdAndAddressCompanyId_When_BothMatch() {
        Cylinder saved = cylinderRepository.save(cylinder("SERIAL-001", testPontoGas, testAddress));

        Optional<Cylinder> found = cylinderRepository.findByIdAndAddressCompanyId(saved.getId(), testCompany.getId());

        assertThat(found).isPresent();
    }

    @Test
    void should_ReturnEmpty_When_CylinderBelongsToDifferentCompany() {
        Cylinder saved = cylinderRepository.save(cylinder("SERIAL-001", testPontoGas, testAddress));

        Company otherCompany = companyRepository.save(Company.builder()
            .name("Other Company").slug("other-company").cnpj("22.222.222/2222-22").active(true).build());

        Optional<Cylinder> found = cylinderRepository.findByIdAndAddressCompanyId(saved.getId(), otherCompany.getId());

        assertThat(found).isEmpty();
    }

    @Test
    void should_Search_BySerial_ScopedByCompany() {
        cylinderRepository.save(cylinder("SERIAL-ABC", testPontoGas, testAddress));
        cylinderRepository.save(cylinder("OTHER-999", testPontoGas, testAddress));

        Page<Cylinder> result = cylinderRepository.search(testCompany.getId(), null, null, "abc", PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getSerialNumber()).isEqualTo("SERIAL-ABC");
    }
}
