package com.gastrack.service;

import com.gastrack.dto.address.AddressRequest;
import com.gastrack.dto.address.AddressResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.AddressMapper;
import com.gastrack.model.*;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CityRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.service.impl.AddressServiceImpl;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceImplTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CityRepository cityRepository;

    @Mock
    private AddressMapper addressMapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @InjectMocks
    private AddressServiceImpl addressService;

    private Country testCountry;
    private State testState;
    private City testCity;
    private Company testCompany;
    private Address testAddress;
    private AddressRequest testRequest;
    private AddressResponse testResponse;

    @BeforeEach
    void setUp() {
        testCountry = Country.builder()
            .id(1L)
            .name("Brasil")
            .code("BR")
            .active(true)
            .build();

        testState = State.builder()
            .id(25L)
            .name("São Paulo")
            .code("35")
            .abbreviation("SP")
            .country(testCountry)
            .active(true)
            .build();

        testCity = City.builder()
            .id(147L)
            .name("São Paulo")
            .code("3550308")
            .state(testState)
            .active(true)
            .build();

        testCompany = Company.builder()
            .id(1L)
            .name("Test Company")
            .slug("test-company")
            .active(true)
            .build();

        testAddress = Address.builder()
            .id(1L)
            .company(testCompany)
            .name("Filial Centro")
            .street("Rua Principal")
            .number("100")
            .city(testCity)
            .zipCode("01000-000")
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testRequest = new AddressRequest(
            1L, "Filial Centro", "Rua Principal", "100",
            null, null, 147L, "01000-000", null, null, null
        );

        testResponse = new AddressResponse(
            1L, 1L, "Test Company", "Filial Centro", "Rua Principal",
            "100", null, null, 147L, "São Paulo", "3550308",
            25L, "São Paulo", "SP", 1L, "Brasil",
            "01000-000", null, null,
            "Rua Principal, 100, São Paulo/SP - CEP: 01000-000",
            true, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    void should_CreateAddress_When_ValidRequest_WithAccessGranted() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(cityRepository.findById(147L)).thenReturn(Optional.of(testCity));
        when(addressMapper.toEntity(testRequest)).thenReturn(testAddress);
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);
        when(addressMapper.toResponse(testAddress)).thenReturn(testResponse);

        AddressResponse result = addressService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Filial Centro");
        verify(addressRepository).save(any(Address.class));
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_ThrowAccessDenied_When_CreateForOtherCompany() {
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> addressService.create(testRequest))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_ThrowException_When_CompanyNotFound() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(companyRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.create(testRequest))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_ThrowException_When_CityNotFound() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(cityRepository.findById(147L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.create(testRequest))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("City");
    }

    @Test
    void should_FindById_When_AccessGranted() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(addressMapper.toResponse(testAddress)).thenReturn(testResponse);

        AddressResponse result = addressService.findById(1L);

        assertThat(result).isNotNull();
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_ThrowAccessDenied_When_FindById_DifferentCompany() {
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> addressService.findById(1L))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_FindAll_FilteredByCompany_WhenNotSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(tenantSecurityService.requireCompanyContext()).thenReturn(1L);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Address> addressPage = new PageImpl<>(List.of(testAddress));
        when(addressRepository.findByCompanyId(1L, pageable)).thenReturn(addressPage);
        when(addressMapper.toResponse(testAddress)).thenReturn(testResponse);

        Page<AddressResponse> result = addressService.findAll(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(addressRepository).findByCompanyId(eq(1L), any(Pageable.class));
    }

    @Test
    void should_FindAll_AllAddresses_WhenSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Address> addressPage = new PageImpl<>(List.of(testAddress));
        when(addressRepository.findAll(pageable)).thenReturn(addressPage);
        when(addressMapper.toResponse(testAddress)).thenReturn(testResponse);

        Page<AddressResponse> result = addressService.findAll(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(addressRepository).findAll(pageable);
    }

    @Test
    void should_ThrowAccessDenied_When_NoCompanyContext() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(tenantSecurityService.requireCompanyContext())
            .thenThrow(new AccessDeniedException("No company context available"));

        Pageable pageable = PageRequest.of(0, 10);

        assertThatThrownBy(() -> addressService.findAll(null, pageable))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_UpdateAddress_When_AccessGranted() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(addressRepository.save(any(Address.class))).thenReturn(testAddress);
        when(addressMapper.toResponse(any(Address.class))).thenReturn(testResponse);

        AddressResponse result = addressService.update(1L, testRequest);

        assertThat(result).isNotNull();
        verify(addressMapper).updateEntity(eq(testRequest), any(Address.class));
    }

    @Test
    void should_DeactivateAddress_When_AccessGranted() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

        addressService.deactivate(1L);

        assertThat(testAddress.getActive()).isFalse();
        verify(addressRepository).save(testAddress);
    }

    @Test
    void should_ActivateAddress_When_AccessGranted() {
        testAddress.setActive(false);
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

        addressService.activate(1L);

        assertThat(testAddress.getActive()).isTrue();
        verify(addressRepository).save(testAddress);
    }

    @Test
    void should_DeleteAddress_When_AccessGranted() {
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

        addressService.delete(1L);

        verify(tenantSecurityService).validateCompanyAccess(1L);
        verify(addressRepository).delete(testAddress);
    }

    @Test
    void should_ThrowResourceNotFound_When_DeleteAddressNotExists() {
        when(addressRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.delete(1L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Address")
            .hasMessageContaining("id");
    }
}
