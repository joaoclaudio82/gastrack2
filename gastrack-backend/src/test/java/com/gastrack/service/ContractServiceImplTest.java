package com.gastrack.service;

import com.gastrack.dto.contract.ContractAddressesUpdateRequest;
import com.gastrack.dto.contract.ContractRequest;
import com.gastrack.dto.contract.ContractResponse;
import com.gastrack.dto.contract.ContractStatusUpdateRequest;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.ContractMapper;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Contract;
import com.gastrack.model.ContractStatus;
import com.gastrack.model.User;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.impl.ContractServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractServiceImplTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private ContractMapper contractMapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @Mock
    private UserService userService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private ContractServiceImpl contractService;

    private MockedStatic<TenantContext> tenantContextMock;

    private Company testCompany;
    private Contract testContract;
    private ContractRequest testRequest;
    private ContractResponse testResponse;
    private User testUser;
    private Address testAddress;
    private static final List<Long> DEFAULT_ADDRESS_IDS = List.of(10L);

    @BeforeEach
    void setUp() {
        tenantContextMock = mockStatic(TenantContext.class);

        testCompany = Company.builder()
            .id(1L)
            .name("Test Company")
            .slug("test-company")
            .active(true)
            .build();

        testUser = User.builder()
            .id(1L)
            .email("user@test.com")
            .firstName("Test")
            .lastName("User")
            .company(testCompany)
            .build();

        testAddress = Address.builder()
            .id(10L)
            .company(testCompany)
            .name("Headquarters")
            .street("Main St")
            .zipCode("12345-000")
            .active(true)
            .build();

        testContract = Contract.builder()
            .id(1L)
            .company(testCompany)
            .contractNumber("CRT-01012025-1")
            .startDate(LocalDate.now())
            .endDate(LocalDate.now().plusYears(1))
            .kitQuantity(10)
            .status(ContractStatus.DRAFT)
            .active(true)
            .createdBy(testUser)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .equipmentKits(new ArrayList<>())
            .build();
        testContract.getAllowedAddresses().add(testAddress);

        testRequest = new ContractRequest(
            1L,
            DEFAULT_ADDRESS_IDS,
            LocalDate.now(),
            LocalDate.now().plusYears(1),
            10,
            "Test contract notes",
            null
        );

        testResponse = new ContractResponse(
            1L,
            1L,
            "Test Company",
            "CRT-01012025-1",
            LocalDate.now(),
            LocalDate.now().plusYears(1),
            10,
            DEFAULT_ADDRESS_IDS,
            0,
            10,
            ContractStatus.DRAFT,
            "Test contract notes",
            true,
            List.of(),
            1L,
            "Test User",
            LocalDateTime.now(),
            LocalDateTime.now()
        );

    }

    @AfterEach
    void tearDown() {
        tenantContextMock.close();
    }

    @Test
    void should_CreateContract_When_ValidRequest() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
        tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        mockDefaultAddressLookup();
        when(contractMapper.toEntity(testRequest)).thenReturn(testContract);
        when(userService.findById(1L)).thenReturn(testUser);
        when(contractRepository.save(any(Contract.class))).thenReturn(testContract);
        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(contractMapper.toResponse(testContract)).thenReturn(testResponse);
        doNothing().when(entityManager).flush();
        doNothing().when(entityManager).clear();

        ContractResponse result = contractService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.contractNumber()).isEqualTo("CRT-01012025-1");
        assertThat(result.kitQuantity()).isEqualTo(10);
        verify(addressRepository).findAllById(DEFAULT_ADDRESS_IDS);
        verify(contractRepository, atLeastOnce()).save(any(Contract.class));
    }

    @Test
    void should_ThrowException_When_CompanyNotFound() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(companyRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.create(testRequest))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_ThrowException_When_AddressNotFound_OnCreate() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(addressRepository.findAllById(DEFAULT_ADDRESS_IDS)).thenReturn(List.of());

        assertThatThrownBy(() -> contractService.create(testRequest))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_ThrowException_When_AddressInactive_OnCreate() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Address inactive = Address.builder()
            .id(10L)
            .company(testCompany)
            .name("Inactive")
            .street("Street")
            .zipCode("00000-000")
            .active(false)
            .build();

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(addressRepository.findAllById(DEFAULT_ADDRESS_IDS)).thenReturn(List.of(inactive));

        assertThatThrownBy(() -> contractService.create(testRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("inactive");
    }

    @Test
    void should_ThrowException_When_AddressFromOtherCompany_OnCreate() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Company other = Company.builder().id(99L).name("Other").build();
        Address otherAddress = Address.builder()
            .id(10L)
            .company(other)
            .name("Other HQ")
            .street("Street")
            .zipCode("12345-000")
            .active(true)
            .build();

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(addressRepository.findAllById(DEFAULT_ADDRESS_IDS)).thenReturn(List.of(otherAddress));

        assertThatThrownBy(() -> contractService.create(testRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("same company");
    }

    private void mockDefaultAddressLookup() {
        when(addressRepository.findAllById(DEFAULT_ADDRESS_IDS)).thenReturn(List.of(testAddress));
    }

    @Test
    void should_ThrowException_When_EndDateBeforeStartDate() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        ContractRequest invalidRequest = new ContractRequest(
            1L,
            DEFAULT_ADDRESS_IDS,
            LocalDate.now(),
            LocalDate.now().minusDays(1),  // Invalid: end before start
            10,
            "Test",
            null
        );

        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        assertThatThrownBy(() -> contractService.create(invalidRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("End date must be after start date");
    }

    @Test
    void should_FindById_When_Exists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(contractMapper.toResponse(testContract)).thenReturn(testResponse);

        ContractResponse result = contractService.findById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void should_ThrowException_When_IdNotFound() {
        when(contractRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.findById(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_ValidateCompanyAccess_When_NotSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);
        tenantContextMock.when(TenantContext::getCurrentCompanyId).thenReturn(1L);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(contractMapper.toResponse(testContract)).thenReturn(testResponse);

        ContractResponse result = contractService.findById(1L);

        assertThat(result).isNotNull();
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_FindAll_ForSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Contract> contractPage = new PageImpl<>(List.of(testContract));
        when(contractRepository.search(null, null, null, pageable)).thenReturn(contractPage);
        when(contractMapper.toResponse(testContract)).thenReturn(testResponse);

        Page<ContractResponse> result = contractService.findAll(pageable, null, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_PassSearchTerm_When_FilteringContracts() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Contract> contractPage = new PageImpl<>(List.of(testContract));
        when(contractRepository.search(null, ContractStatus.ACTIVE, "CRT-1", pageable)).thenReturn(contractPage);
        when(contractMapper.toResponse(testContract)).thenReturn(testResponse);

        Page<ContractResponse> result = contractService.findAll(pageable, ContractStatus.ACTIVE, "  CRT-1  ");

        assertThat(result.getContent()).hasSize(1);
        // search é normalizado (trim) e propagado ao repositório
        verify(contractRepository).search(null, ContractStatus.ACTIVE, "CRT-1", pageable);
    }

    @Test
    void should_NormalizeBlankSearchToNull_When_FilteringContracts() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        when(contractRepository.search(null, null, null, pageable))
            .thenReturn(new PageImpl<>(List.of()));

        contractService.findAll(pageable, null, "   ");

        verify(contractRepository).search(null, null, null, pageable);
    }

    @Test
    void should_FindByCompany_WhenSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Contract> contractPage = new PageImpl<>(List.of(testContract));
        when(contractRepository.findByCompanyIdAndActive(1L, true, pageable)).thenReturn(contractPage);
        when(contractMapper.toResponse(testContract)).thenReturn(testResponse);

        Page<ContractResponse> result = contractService.findByCompany(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_UpdateContract_When_ValidRequest() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        ContractRequest updateRequest = new ContractRequest(
            1L,
            DEFAULT_ADDRESS_IDS,
            LocalDate.now(),
            LocalDate.now().plusYears(2),
            20,
            "Updated notes",
            null
        );

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        mockDefaultAddressLookup();
        when(contractRepository.save(any(Contract.class))).thenReturn(testContract);
        when(contractMapper.toResponse(any(Contract.class))).thenReturn(testResponse);

        ContractResponse result = contractService.update(1L, updateRequest);

        assertThat(result).isNotNull();
        verify(contractMapper).updateEntity(eq(updateRequest), any(Contract.class));
        verify(addressRepository).findAllById(DEFAULT_ADDRESS_IDS);
    }

    @Test
    void should_ThrowException_When_ReducingKitQuantityBelowActiveKits() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        ContractRequest updateRequest = new ContractRequest(
            1L,
            DEFAULT_ADDRESS_IDS,
            LocalDate.now(),
            LocalDate.now().plusYears(1),
            5, // Trying to reduce to 5
            "Notes",
            null
        );

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        mockDefaultAddressLookup();
        when(contractRepository.countActiveKitsByContractId(1L)).thenReturn(8L); // 8 active kits

        assertThatThrownBy(() -> contractService.update(1L, updateRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Cannot reduce kit quantity below");
    }

    @Test
    void should_UpdateStatus_When_Valid() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        ContractStatusUpdateRequest statusRequest = new ContractStatusUpdateRequest(ContractStatus.ACTIVE);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(Contract.class))).thenReturn(testContract);
        when(contractMapper.toResponse(any(Contract.class))).thenReturn(testResponse);

        ContractResponse result = contractService.updateStatus(1L, statusRequest);

        assertThat(result).isNotNull();
        verify(contractRepository).save(any(Contract.class));
    }

    @Test
    void should_UpdateAddresses_When_ValidRequest() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        ContractAddressesUpdateRequest addressesRequest = new ContractAddressesUpdateRequest(DEFAULT_ADDRESS_IDS);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findAllById(DEFAULT_ADDRESS_IDS)).thenReturn(List.of(testAddress));
        when(contractRepository.save(any(Contract.class))).thenReturn(testContract);
        when(contractMapper.toResponse(any(Contract.class))).thenReturn(testResponse);

        ContractResponse result = contractService.updateAddresses(1L, addressesRequest);

        assertThat(result).isNotNull();
        verify(addressRepository).findAllById(DEFAULT_ADDRESS_IDS);
        verify(contractRepository).save(any(Contract.class));
    }

    @Test
    void should_ReturnAllowedAddresses() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(contractRepository.findByIdWithAddresses(1L)).thenReturn(Optional.of(testContract));

        var addresses = contractService.getAllowedAddresses(1L);

        assertThat(addresses).hasSize(1);
        assertThat(addresses.get(0).id()).isEqualTo(10L);
    }

    @Test
    void should_DeactivateContract_When_Exists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));

        contractService.deactivate(1L);

        assertThat(testContract.getActive()).isFalse();
        verify(contractRepository).save(testContract);
    }

    @Test
    void should_ActivateContract_When_Exists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testContract.setActive(false);
        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));

        contractService.activate(1L);

        assertThat(testContract.getActive()).isTrue();
        verify(contractRepository).save(testContract);
    }
}
