package com.gastrack.service;

import com.gastrack.dto.company.CompanyRequest;
import com.gastrack.dto.company.CompanyResponse;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CompanyMapper;
import com.gastrack.model.*;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.service.impl.CompanyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private CylinderRepository cylinderRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private EquipmentKitRepository equipmentKitRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private PontoGasRepository pontoGasRepository;

    @Mock
    private CompanyMapper companyMapper;

    @InjectMocks
    private CompanyServiceImpl companyService;

    private Company testCompany;
    private CompanyRequest testRequest;
    private CompanyResponse testResponse;

    @BeforeEach
    void setUp() {
        testCompany = Company.builder()
            .id(1L)
            .name("Test Company")
            .slug("test-company")
            .cnpj("12.345.678/0001-90")
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testRequest = new CompanyRequest("Test Company", "test-company", "12.345.678/0001-90", null, null);

        testResponse = new CompanyResponse(
            1L, "Test Company", "test-company", "12.345.678/0001-90",
            null, null, true, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    void should_CreateCompany_When_ValidRequest() {
        when(companyRepository.existsBySlug("test-company")).thenReturn(false);
        when(companyRepository.existsByCnpj("12.345.678/0001-90")).thenReturn(false);
        when(companyMapper.toEntity(testRequest)).thenReturn(testCompany);
        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);
        when(companyMapper.toResponse(testCompany)).thenReturn(testResponse);

        CompanyResponse result = companyService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Test Company");
        assertThat(result.slug()).isEqualTo("test-company");
        verify(companyRepository).save(any(Company.class));
    }

    @Test
    void should_ThrowException_When_SlugExists() {
        when(companyRepository.existsBySlug("test-company")).thenReturn(true);

        assertThatThrownBy(() -> companyService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("slug");
    }

    @Test
    void should_ThrowException_When_CnpjExists() {
        when(companyRepository.existsBySlug("test-company")).thenReturn(false);
        when(companyRepository.existsByCnpj("12.345.678/0001-90")).thenReturn(true);

        assertThatThrownBy(() -> companyService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("CNPJ");
    }

    @Test
    void should_FindById_When_Exists() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(companyMapper.toResponse(testCompany)).thenReturn(testResponse);

        CompanyResponse result = companyService.findById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void should_ThrowException_When_IdNotFound() {
        when(companyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.findById(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_FindBySlug_When_Exists() {
        when(companyRepository.findBySlug("test-company")).thenReturn(Optional.of(testCompany));
        when(companyMapper.toResponse(testCompany)).thenReturn(testResponse);

        CompanyResponse result = companyService.findBySlug("test-company");

        assertThat(result).isNotNull();
        assertThat(result.slug()).isEqualTo("test-company");
    }

    @Test
    void should_FindAll_WithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Company> companyPage = new PageImpl<>(List.of(testCompany));
        when(companyRepository.findAll(pageable)).thenReturn(companyPage);
        when(companyMapper.toResponse(testCompany)).thenReturn(testResponse);

        Page<CompanyResponse> result = companyService.findAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Test Company");
    }

    @Test
    void should_FindAllActive_WithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Company> companyPage = new PageImpl<>(List.of(testCompany));
        when(companyRepository.findByActive(true, pageable)).thenReturn(companyPage);
        when(companyMapper.toResponse(testCompany)).thenReturn(testResponse);

        Page<CompanyResponse> result = companyService.findAllActive(null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_UpdateCompany_When_ValidRequest() {
        CompanyRequest updateRequest = new CompanyRequest("Updated Company", "test-company", "12.345.678/0001-90", null, null);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);
        when(companyMapper.toResponse(any(Company.class))).thenReturn(
            new CompanyResponse(1L, "Updated Company", "test-company", "12.345.678/0001-90",
                null, null, true, LocalDateTime.now(), LocalDateTime.now())
        );

        CompanyResponse result = companyService.update(1L, updateRequest);

        assertThat(result.name()).isEqualTo("Updated Company");
        verify(companyMapper).updateEntity(eq(updateRequest), any(Company.class));
    }

    @Test
    void should_ThrowException_When_UpdateSlugToDuplicate() {
        CompanyRequest updateRequest = new CompanyRequest(
            "Updated Company", "existing-slug", "12.345.678/0001-90", null, null);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(companyRepository.findBySlug("existing-slug")).thenReturn(Optional.of(
            Company.builder().id(2L).slug("existing-slug").build()
        ));

        assertThatThrownBy(() -> companyService.update(1L, updateRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("slug");
    }

    @Test
    void should_DeactivateCompany_When_Exists() {
        // Mock cascade - company has no addresses
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(addressRepository.findByCompanyId(1L)).thenReturn(Collections.emptyList());
        when(equipmentKitRepository.findActiveByCompanyIdList(1L)).thenReturn(Collections.emptyList());
        when(contractRepository.findByCompanyIdAndActiveTrue(1L)).thenReturn(Collections.emptyList());

        companyService.deactivate(1L);

        assertThat(testCompany.getActive()).isFalse();
        verify(companyRepository).save(testCompany);
    }

    @Test
    void should_CascadeDeactivate_AddressesAndCylinders() {
        // Setup location hierarchy
        Country country = Country.builder()
            .id(1L)
            .name("Brasil")
            .code("BR")
            .active(true)
            .build();

        State state = State.builder()
            .id(25L)
            .name("São Paulo")
            .code("35")
            .abbreviation("SP")
            .country(country)
            .active(true)
            .build();

        City city = City.builder()
            .id(147L)
            .name("São Paulo")
            .code("3550308")
            .state(state)
            .active(true)
            .build();

        // Setup address
        Address address = Address.builder()
            .id(1L)
            .company(testCompany)
            .name("Test Address")
            .street("Test Street")
            .city(city)
            .zipCode("01000-000")
            .active(true)
            .build();

        // Setup cylinder
        Cylinder cylinder = Cylinder.builder()
            .id(1L)
            .address(address)
            .serialNumber("SERIAL-001")
            .active(true)
            .build();

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(equipmentKitRepository.findActiveByCompanyIdList(1L)).thenReturn(Collections.emptyList());
        when(contractRepository.findByCompanyIdAndActiveTrue(1L)).thenReturn(Collections.emptyList());
        when(pontoGasRepository.findByAddressCompanyIdAndActiveTrue(1L)).thenReturn(Collections.emptyList());
        when(addressRepository.findByCompanyId(1L)).thenReturn(List.of(address));
        when(cylinderRepository.findByAddressId(1L)).thenReturn(List.of(cylinder));

        companyService.deactivate(1L);

        // Verify cascade deactivation
        assertThat(testCompany.getActive()).isFalse();
        assertThat(address.getActive()).isFalse();
        assertThat(cylinder.getActive()).isFalse();

        verify(cylinderRepository).save(cylinder);
        verify(addressRepository).save(address);
        verify(companyRepository).save(testCompany);
    }

    @Test
    void should_ActivateCompany_When_Exists() {
        testCompany.setActive(false);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        companyService.activate(1L);

        assertThat(testCompany.getActive()).isTrue();
        verify(companyRepository).save(testCompany);
    }
}
