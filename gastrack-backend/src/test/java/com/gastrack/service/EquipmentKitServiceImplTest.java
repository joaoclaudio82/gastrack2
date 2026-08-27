package com.gastrack.service;

import com.gastrack.dto.equipmentkit.EquipmentKitRequest;
import com.gastrack.dto.equipmentkit.EquipmentKitResponse;
import com.gastrack.dto.equipmentkit.EquipmentKitStatusUpdateRequest;
import com.gastrack.dto.equipmentkit.SwapEspRequest;
import com.gastrack.dto.equipmentkit.SwapSensorRequest;
import com.gastrack.dto.kitinstallation.KitInstallRequest;
import com.gastrack.dto.kitinstallation.KitUninstallRequest;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.dto.equipmentkit.KitCylinderView;
import com.gastrack.mapper.EquipmentKitMapper;
import com.gastrack.model.*;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.ContractRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.KitInstallationRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.impl.EquipmentKitServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
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
class EquipmentKitServiceImplTest {

    @Mock
    private EquipmentKitRepository equipmentKitRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private EquipmentKitMapper equipmentKitMapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @Mock
    private UserService userService;

    @Mock
    private KitInstallationRepository kitInstallationRepository;

    @Mock
    private MovementHistoryService movementHistoryService;

    @Mock
    private CylinderRepository cylinderRepository;

    @Mock
    private DeviceProvisioningService deviceProvisioningService;

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private EquipmentKitServiceImpl equipmentKitService;

    private MockedStatic<TenantContext> tenantContextMock;

    private Company testCompany;
    private Contract testContract;
    private Address testAddress;
    private EquipmentKit testKit;
    private EquipmentKitRequest testRequest;
    private EquipmentKitResponse testResponse;
    private User testUser;

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

        testContract = Contract.builder()
            .id(1L)
            .company(testCompany)
            .contractNumber("CT-2024-001")
            .startDate(LocalDate.now())
            .kitQuantity(10)
            .status(ContractStatus.ACTIVE)
            .active(true)
            .equipmentKits(new ArrayList<>())
            .build();

        testAddress = Address.builder()
            .id(1L)
            .company(testCompany)
            .name("Test Address")
            .street("Test Street")
            .zipCode("12345-000")
            .active(true)
            .build();
        testContract.getAllowedAddresses().add(testAddress);

        testKit = EquipmentKit.builder()
            .id(1L)
            .contract(testContract)
            .address(testAddress)
            .kitCode("KIT-001")
            .installationDate(LocalDate.now())
            .status(KitStatus.PENDING)
            .active(true)
            .createdBy(testUser)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .equipments(new ArrayList<>())
            .build();

        testRequest = new EquipmentKitRequest(
            1L,
            1L,
            "KIT-001",
            LocalDate.now(),
            "Test kit notes"
        );

        testResponse = new EquipmentKitResponse(
            1L,
            1L,
            "CT-2024-001",
            1L,
            "Test Company",
            1L,
            "Test Address",
            "KIT-001",
            LocalDate.now(),
            KitStatus.PENDING,
            "Test kit notes",
            0,
            true,
            1L,
            "Test User",
            LocalDateTime.now(),
            LocalDateTime.now(),
            null
        );
    }

    @AfterEach
    void tearDown() {
        tenantContextMock.close();
    }

    @Test
    void should_CreateEquipmentKit_When_ValidRequest() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
        tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(equipmentKitRepository.existsByKitCode("KIT-001")).thenReturn(false);
        when(equipmentKitRepository.countActiveByContractId(1L)).thenReturn(0L);
        when(equipmentKitMapper.toEntity(testRequest)).thenReturn(testKit);
        when(userService.findById(1L)).thenReturn(testUser);
        when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
        when(equipmentKitMapper.toResponse(testKit)).thenReturn(testResponse);

        EquipmentKitResponse result = equipmentKitService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.kitCode()).isEqualTo("KIT-001");
        verify(equipmentKitRepository).save(any(EquipmentKit.class));
    }

    @Test
    void should_ThrowException_When_KitCodeExists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(equipmentKitRepository.existsByKitCode("KIT-001")).thenReturn(true);

        assertThatThrownBy(() -> equipmentKitService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("kit code already exists");
    }

    @Test
    void should_ThrowException_When_ContractNotActive() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testContract.setStatus(ContractStatus.DRAFT);
        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(equipmentKitRepository.existsByKitCode("KIT-001")).thenReturn(false);

        assertThatThrownBy(() -> equipmentKitService.create(testRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Contract must be ACTIVE");
    }

    @Test
    void should_ThrowException_When_KitQuantityExceeded() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testContract.setKitQuantity(5);
        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
        when(equipmentKitRepository.existsByKitCode("KIT-001")).thenReturn(false);
        when(equipmentKitRepository.countActiveByContractId(1L)).thenReturn(5L); // Already at max

        assertThatThrownBy(() -> equipmentKitService.create(testRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("maximum number of kits");
    }

    @Test
    void should_ThrowException_When_AddressFromDifferentCompany() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Company otherCompany = Company.builder()
            .id(2L)
            .name("Other Company")
            .build();

        Address otherAddress = Address.builder()
            .id(2L)
            .company(otherCompany)
            .name("Other Address")
            .build();

        EquipmentKitRequest requestWithOtherAddress = new EquipmentKitRequest(
            1L,
            2L,
            "KIT-002",
            LocalDate.now(),
            "Notes"
        );

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> equipmentKitService.create(requestWithOtherAddress))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("same company");
    }

    @Test
    void should_ThrowException_When_AddressNotAllowedForContract() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Address otherAddress = Address.builder()
            .id(2L)
            .company(testCompany)
            .name("Other Address")
            .street("Street 2")
            .zipCode("00000-000")
            .active(true)
            .build();

        EquipmentKitRequest requestWithOtherAddress = new EquipmentKitRequest(
            1L,
            2L,
            "KIT-002",
            LocalDate.now(),
            "Notes"
        );

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> equipmentKitService.create(requestWithOtherAddress))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("not enabled for this contract");
    }

    @Test
    void should_FindById_When_Exists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentKitMapper.toResponse(testKit)).thenReturn(testResponse);

        EquipmentKitResponse result = equipmentKitService.findById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void should_ReturnCylinders_When_KitDetailHasSensorPointWithCylinder() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        PontoGas point = PontoGas.builder()
            .id(10L)
            .location("Cozinha")
            .currentPressureBar(java.math.BigDecimal.valueOf(120))
            .status(CylinderStatus.FULL)
            .build();

        Equipment sensor = Equipment.builder()
            .id(5L)
            .assetTag("SENSOR-1")
            .equipmentKit(testKit)
            .pontoGas(point)
            .active(true)
            .build();
        testKit.setEquipments(new ArrayList<>(List.of(sensor)));

        CylinderModel model = CylinderModel.builder().id(3L).gasType(GasType.O2).build();
        Cylinder cylinder = Cylinder.builder()
            .id(7L)
            .serialNumber("CYL-7")
            .cylinderModel(model)
            .pontoGas(point)
            .active(true)
            .build();

        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentKitMapper.toResponse(testKit)).thenReturn(testResponse);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(10L)).thenReturn(List.of(cylinder));

        EquipmentKitResponse result = equipmentKitService.findById(1L);

        assertThat(result.cylinders()).hasSize(1);
        KitCylinderView view = result.cylinders().get(0);
        assertThat(view.cylinderId()).isEqualTo(7L);
        assertThat(view.serialNumber()).isEqualTo("CYL-7");
        assertThat(view.gasType()).isEqualTo(GasType.O2);
        assertThat(view.pontoGasId()).isEqualTo(10L);
        assertThat(view.pontoGasName()).isEqualTo("Cozinha");
        assertThat(view.currentPressureBar()).isEqualByComparingTo(java.math.BigDecimal.valueOf(120));
        assertThat(view.status()).isEqualTo(CylinderStatus.FULL);
    }

    @Test
    void should_ThrowException_When_IdNotFound() {
        when(equipmentKitRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> equipmentKitService.findById(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void should_ValidateCompanyAccess_When_NotSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);
        tenantContextMock.when(TenantContext::getCurrentCompanyId).thenReturn(1L);

        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentKitMapper.toResponse(testKit)).thenReturn(testResponse);

        EquipmentKitResponse result = equipmentKitService.findById(1L);

        assertThat(result).isNotNull();
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_FindAll_ForSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentKit> kitPage = new PageImpl<>(List.of(testKit));
        when(equipmentKitRepository.search(null, null, null, pageable)).thenReturn(kitPage);
        when(equipmentKitMapper.toResponse(testKit)).thenReturn(testResponse);

        Page<EquipmentKitResponse> result = equipmentKitService.findAll(pageable, null, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_FindByContract() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));

        Pageable pageable = PageRequest.of(0, 10);
        Page<EquipmentKit> kitPage = new PageImpl<>(List.of(testKit));
        when(equipmentKitRepository.findByContractIdAndActive(1L, true, pageable)).thenReturn(kitPage);
        when(equipmentKitMapper.toResponse(testKit)).thenReturn(testResponse);

        Page<EquipmentKitResponse> result = equipmentKitService.findByContract(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_UpdateStatus_When_Valid() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentKitStatusUpdateRequest statusRequest = new EquipmentKitStatusUpdateRequest(KitStatus.INSTALLED);

        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
        when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

        EquipmentKitResponse result = equipmentKitService.updateStatus(1L, statusRequest);

        assertThat(result).isNotNull();
        verify(equipmentKitRepository).save(any(EquipmentKit.class));
    }

    @Test
    void should_DeactivateKit_When_Exists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

        equipmentKitService.deactivate(1L);

        assertThat(testKit.getActive()).isFalse();
        verify(equipmentKitRepository).save(testKit);
    }

    @Test
    void should_ActivateKit_When_Exists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testKit.setActive(false);
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

        equipmentKitService.activate(1L);

        assertThat(testKit.getActive()).isTrue();
        verify(equipmentKitRepository).save(testKit);
    }

    @Nested
    class InstallKitTests {

        private KitInstallRequest installRequest;
        private EquipmentKitResponse installedResponse;
        private Equipment testEquipment;

        @BeforeEach
        void setUpInstallTests() {
            installRequest = new KitInstallRequest(
                1L,
                LocalDate.now(),
                "Installation notes"
            );

            installedResponse = new EquipmentKitResponse(
                1L,
                1L,
                "CT-2024-001",
                1L,
                "Test Company",
                1L,
                "Test Address",
                "KIT-001",
                LocalDate.now(),
                KitStatus.INSTALLED,
                "Installation notes",
                1,
                true,
                1L,
                "Test User",
                LocalDateTime.now(),
                LocalDateTime.now(),
                null
            );

            // Add equipment to kit (required for installation)
            testEquipment = Equipment.builder()
                .id(1L)
                .assetTag("EQ-001")
                .equipmentKit(testKit)
                .active(true)
                .build();
            testKit.setEquipments(new ArrayList<>(List.of(testEquipment)));
        }

        @Test
        void should_InstallKit_When_ValidRequest() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.PENDING);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(installedResponse);

            EquipmentKitResponse result = equipmentKitService.installKit(1L, installRequest);

            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(KitStatus.INSTALLED);
            verify(equipmentKitRepository).save(any(EquipmentKit.class));
            verify(kitInstallationRepository).save(any(KitInstallation.class));
        }

        @Test
        void should_CreateInstallationRecord_When_KitInstalled() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.PENDING);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(installedResponse);

            equipmentKitService.installKit(1L, installRequest);

            verify(kitInstallationRepository).save(argThat(installation ->
                installation.getOperationType() == KitOperationType.INSTALLED &&
                installation.getKit() == testKit &&
                installation.getAddress() == testAddress &&
                installation.getPerformedBy() == testUser
            ));
        }

        @Test
        void should_UseCurrentDate_When_NoDateProvided() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            KitInstallRequest requestWithoutDate = new KitInstallRequest(1L, null, "Notes");
            testKit.setStatus(KitStatus.PENDING);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(installedResponse);

            equipmentKitService.installKit(1L, requestWithoutDate);

            verify(equipmentKitRepository).save(argThat(kit ->
                kit.getInstallationDate() != null &&
                kit.getInstallationDate().isEqual(LocalDate.now())
            ));
        }

        @Test
        void should_AllowReinstall_When_StatusIsRemoved() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.REMOVED);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(installedResponse);

            EquipmentKitResponse result = equipmentKitService.installKit(1L, installRequest);

            assertThat(result).isNotNull();
            verify(equipmentKitRepository).save(argThat(kit ->
                kit.getStatus() == KitStatus.INSTALLED
            ));
        }

        @Test
        void should_ThrowException_When_KitNotFound() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            when(equipmentKitRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> equipmentKitService.installKit(999L, installRequest))
                .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        void should_ThrowException_When_KitInactive() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setActive(false);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactive");
        }

        @Test
        void should_ThrowException_When_KitAlreadyInstalled() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.INSTALLED);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cannot be installed");
        }

        @Test
        void should_ThrowException_When_KitInMaintenance() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.MAINTENANCE);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cannot be installed");
        }

        @Test
        void should_ThrowException_When_KitDecommissioned() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.DECOMMISSIONED);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cannot be installed");
        }

        @Test
        void should_ThrowException_When_ContractNotActive_OnInstall() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.PENDING);
            testContract.setStatus(ContractStatus.DRAFT);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Contract must be ACTIVE");
        }

        @Test
        void should_ThrowException_When_ContractExpired() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.PENDING);
            testContract.setEndDate(LocalDate.now().minusDays(1));
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expired");
        }

        @Test
        void should_ThrowException_When_AddressNotFound() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.PENDING);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        void should_ThrowException_When_AddressInactive() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            Address inactiveAddress = Address.builder()
                .id(3L)
                .company(testCompany)
                .name("Inactive Address")
                .active(false)
                .build();

            KitInstallRequest requestWithInactiveAddress = new KitInstallRequest(3L, LocalDate.now(), "Notes");

            testKit.setStatus(KitStatus.PENDING);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(3L)).thenReturn(Optional.of(inactiveAddress));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, requestWithInactiveAddress))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactive address");
        }

        @Test
        void should_ThrowException_When_AddressFromDifferentCompany_OnInstall() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            Company otherCompany = Company.builder()
                .id(2L)
                .name("Other Company")
                .build();

            Address otherAddress = Address.builder()
                .id(2L)
                .company(otherCompany)
                .name("Other Address")
                .build();

            KitInstallRequest requestWithOtherAddress = new KitInstallRequest(2L, LocalDate.now(), "Notes");

            testKit.setStatus(KitStatus.PENDING);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, requestWithOtherAddress))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("same company");
        }

        @Test
        void should_ThrowException_When_AddressNotAllowed_OnInstall() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            Address otherAddress = Address.builder()
                .id(3L)
                .company(testCompany)
                .name("Other Address")
                .active(true)
                .build();

            KitInstallRequest requestWithOtherAddress = new KitInstallRequest(3L, LocalDate.now(), "Notes");

            testKit.setStatus(KitStatus.PENDING);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(3L)).thenReturn(Optional.of(otherAddress));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, requestWithOtherAddress))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not enabled for this contract");
        }

        @Test
        void should_ThrowException_When_DateBeforeContractStart() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.PENDING);
            testContract.setStartDate(LocalDate.now().plusDays(5));

            KitInstallRequest requestWithEarlyDate = new KitInstallRequest(
                1L,
                LocalDate.now(),
                "Notes"
            );

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, requestWithEarlyDate))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("before contract start");
        }

        @Test
        void should_ThrowException_When_KitHasNoEquipment() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.PENDING);
            testKit.setEquipments(new ArrayList<>()); // Empty

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(addressRepository.findById(1L)).thenReturn(Optional.of(testAddress));

            assertThatThrownBy(() -> equipmentKitService.installKit(1L, installRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("at least one equipment");
        }
    }

    @Nested
    class UpdateStatusTests {

        @Test
        void should_UnassignEquipment_When_StatusChangesToRemoved() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            Equipment equipment1 = Equipment.builder()
                .id(1L)
                .assetTag("EQ-001")
                .equipmentKit(testKit)
                .active(true)
                .build();

            Equipment equipment2 = Equipment.builder()
                .id(2L)
                .assetTag("EQ-002")
                .equipmentKit(testKit)
                .active(true)
                .build();

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setEquipments(new ArrayList<>(List.of(equipment1, equipment2)));

            EquipmentKitStatusUpdateRequest statusRequest = new EquipmentKitStatusUpdateRequest(KitStatus.REMOVED);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.updateStatus(1L, statusRequest);

            // Verify equipment was unassigned
            assertThat(equipment1.getEquipmentKit()).isNull();
            assertThat(equipment2.getEquipmentKit()).isNull();
        }

        @Test
        void should_ThrowException_When_TransitionNotAllowed() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.DECOMMISSIONED);
            EquipmentKitStatusUpdateRequest statusRequest = new EquipmentKitStatusUpdateRequest(KitStatus.INSTALLED);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.updateStatus(1L, statusRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot transition kit from");

            verify(equipmentKitRepository, never()).save(any(EquipmentKit.class));
        }

        @Test
        void should_AllowTransition_When_Valid() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.INSTALLED);
            EquipmentKitStatusUpdateRequest statusRequest = new EquipmentKitStatusUpdateRequest(KitStatus.MAINTENANCE);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.updateStatus(1L, statusRequest);

            assertThat(testKit.getStatus()).isEqualTo(KitStatus.MAINTENANCE);
            verify(equipmentKitRepository).save(any(EquipmentKit.class));
        }

        @Test
        void should_NotUnassignEquipment_When_StatusChangesToMaintenance() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            Equipment equipment = Equipment.builder()
                .id(1L)
                .assetTag("EQ-001")
                .equipmentKit(testKit)
                .active(true)
                .build();

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setEquipments(new ArrayList<>(List.of(equipment)));

            EquipmentKitStatusUpdateRequest statusRequest = new EquipmentKitStatusUpdateRequest(KitStatus.MAINTENANCE);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.updateStatus(1L, statusRequest);

            // Equipment should still be assigned
            assertThat(equipment.getEquipmentKit()).isEqualTo(testKit);
        }
    }

    @Nested
    class UninstallKitTests {

        @Test
        void should_UninstallKit_When_ValidRequest() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setAddress(testAddress);

            KitUninstallRequest uninstallRequest = new KitUninstallRequest(
                LocalDate.now(),
                "Contract ended",
                "All equipment returned"
            );

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            EquipmentKitResponse result = equipmentKitService.uninstallKit(1L, uninstallRequest);

            assertThat(result).isNotNull();
            assertThat(testKit.getStatus()).isEqualTo(KitStatus.REMOVED);
            verify(kitInstallationRepository).save(argThat(installation ->
                installation.getOperationType() == KitOperationType.UNINSTALLED
            ));
        }

        @Test
        void should_CreateUninstallationRecord_When_KitUninstalled() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setAddress(testAddress);

            KitUninstallRequest uninstallRequest = new KitUninstallRequest(
                LocalDate.now(),
                "Maintenance required",
                "Notes"
            );

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.uninstallKit(1L, uninstallRequest);

            verify(kitInstallationRepository).save(argThat(installation ->
                installation.getOperationType() == KitOperationType.UNINSTALLED &&
                installation.getKit() == testKit &&
                installation.getAddress() == testAddress &&
                installation.getNotes().contains("Maintenance required")
            ));
        }

        @Test
        void should_ThrowException_When_KitNotInstalled() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.PENDING);

            KitUninstallRequest uninstallRequest = new KitUninstallRequest(null, null, null);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.uninstallKit(1L, uninstallRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not installed");
        }

        @Test
        void should_ThrowException_When_KitHasNoAddress() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setAddress(null);

            KitUninstallRequest uninstallRequest = new KitUninstallRequest(null, null, null);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

            assertThatThrownBy(() -> equipmentKitService.uninstallKit(1L, uninstallRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no address");
        }

        @Test
        void should_UseCurrentDate_When_NoDateProvided() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setAddress(testAddress);

            KitUninstallRequest uninstallRequest = new KitUninstallRequest(null, null, null);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class))).thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.uninstallKit(1L, uninstallRequest);

            verify(kitInstallationRepository).save(argThat(installation ->
                installation.getOperationDate().isEqual(LocalDate.now())
            ));
        }
    }

    @Nested
    class UpdateCrossCompanyTests {

        @Test
        void should_ThrowException_When_UpdateMovesKitToDifferentCompany() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            Company otherCompany = Company.builder().id(2L).name("Other Company").build();
            Contract otherContract = Contract.builder()
                .id(2L)
                .company(otherCompany)
                .contractNumber("CT-OTHER")
                .startDate(LocalDate.now())
                .kitQuantity(5)
                .status(ContractStatus.ACTIVE)
                .active(true)
                .build();

            // testKit belongs to company 1; new contract belongs to company 2 -> cross-company move
            EquipmentKitRequest req = new EquipmentKitRequest(2L, null, "KIT-001", LocalDate.now(), "notes");

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(contractRepository.findById(2L)).thenReturn(Optional.of(otherContract));

            assertThatThrownBy(() -> equipmentKitService.update(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cross-company");
            verify(equipmentKitRepository, never()).save(any(EquipmentKit.class));
        }

        @Test
        void should_UpdateKit_When_SameCompanyDifferentAddress() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

            Address newAddress = Address.builder()
                .id(9L)
                .company(testCompany)
                .name("New Address")
                .street("New Street")
                .zipCode("00000-000")
                .active(true)
                .build();
            testContract.getAllowedAddresses().add(newAddress);

            // Same contract/company, only the address changes -> allowed
            EquipmentKitRequest req = new EquipmentKitRequest(1L, 9L, "KIT-001", LocalDate.now(), "notes");

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(contractRepository.findById(1L)).thenReturn(Optional.of(testContract));
            when(addressRepository.findById(9L)).thenReturn(Optional.of(newAddress));
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            EquipmentKitResponse result = equipmentKitService.update(1L, req);

            assertThat(result).isNotNull();
            verify(equipmentKitRepository).save(testKit);
        }
    }

    @Nested
    class CredentialOnRemovalTests {

        @Test
        void should_DeactivateCredential_When_KitRemovedHasEsp32() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            EquipmentType esp32Type = EquipmentType.builder().id(99L).name("ESP32").active(true).build();
            Equipment esp32 = Equipment.builder()
                .id(30L).equipmentType(esp32Type).equipmentKit(testKit)
                .assetTag("ESP-30").serialNumber("SER30").active(true).build();

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setEquipments(new ArrayList<>(List.of(esp32)));

            EquipmentKitStatusUpdateRequest req = new EquipmentKitStatusUpdateRequest(KitStatus.REMOVED);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.updateStatus(1L, req);

            verify(deviceProvisioningService).deactivateCredential(esp32);
            verify(deviceProvisioningService, never()).revokeCredential(any(Equipment.class));
        }

        @Test
        void should_NotTouchCredentialViaKit_When_KitDecommissioned() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            EquipmentType esp32Type = EquipmentType.builder().id(99L).name("ESP32").active(true).build();
            Equipment esp32 = Equipment.builder()
                .id(31L).equipmentType(esp32Type).equipmentKit(testKit)
                .assetTag("ESP-31").serialNumber("SER31").active(true).build();

            testKit.setStatus(KitStatus.REMOVED);
            testKit.setEquipments(new ArrayList<>(List.of(esp32)));

            EquipmentKitStatusUpdateRequest req = new EquipmentKitStatusUpdateRequest(KitStatus.DECOMMISSIONED);

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.updateStatus(1L, req);

            // Revoke is a DEVICE concern (EquipmentService.deactivate), not a kit-status concern.
            verify(deviceProvisioningService, never()).revokeCredential(any(Equipment.class));
            verify(deviceProvisioningService, never()).deactivateCredential(any(Equipment.class));
        }

        @Test
        void should_DeactivateCredential_When_KitUninstalledHasEsp32() {
            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

            EquipmentType esp32Type = EquipmentType.builder().id(99L).name("ESP32").active(true).build();
            Equipment esp32 = Equipment.builder()
                .id(32L).equipmentType(esp32Type).equipmentKit(testKit)
                .assetTag("ESP-32").serialNumber("SER32").active(true).build();

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.setAddress(testAddress);
            testKit.setEquipments(new ArrayList<>(List.of(esp32)));

            KitUninstallRequest uninstallRequest = new KitUninstallRequest(LocalDate.now(), "reason", "notes");

            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            when(userService.findById(1L)).thenReturn(testUser);
            when(equipmentKitRepository.save(any(EquipmentKit.class))).thenReturn(testKit);
            when(kitInstallationRepository.save(any(KitInstallation.class)))
                .thenReturn(KitInstallation.builder().id(1L).build());
            when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);

            equipmentKitService.uninstallKit(1L, uninstallRequest);

            verify(deviceProvisioningService).deactivateCredential(esp32);
        }
    }

    @Nested
    class SwapHardware {

        private EquipmentType esp32Type;
        private EquipmentType sensorType;
        private Equipment oldEsp;
        private Equipment sensor;
        private PontoGas point;

        @BeforeEach
        void swapSetup() {
            esp32Type = EquipmentType.builder().id(99L).name("ESP32").active(true).build();
            sensorType = EquipmentType.builder().id(98L).name("Sensor").active(true).build();
            point = PontoGas.builder().id(500L).address(testAddress).location("Cozinha").build();

            oldEsp = Equipment.builder()
                .id(10L).assetTag("ESP-OLD").equipmentType(esp32Type)
                .serialNumber("OLD123").active(true).equipmentKit(testKit)
                .build();
            sensor = Equipment.builder()
                .id(20L).assetTag("SEN-1").equipmentType(sensorType)
                .parentEquipment(oldEsp).sensorPort(3).codigoSensor("OLD123|3")
                .pontoGas(point).active(true).equipmentKit(testKit)
                .build();

            testKit.setStatus(KitStatus.INSTALLED);
            testKit.getEquipments().add(oldEsp);
            testKit.getEquipments().add(sensor);

            tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
            when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
            lenient().when(equipmentKitRepository.save(any(EquipmentKit.class))).thenAnswer(inv -> inv.getArgument(0));
            lenient().when(equipmentKitMapper.toResponse(any(EquipmentKit.class))).thenReturn(testResponse);
        }

        @Test
        void should_RewriteSensorCodigoAndReturnOldEspToStock_When_EspSwappedWithoutRetire() {
            Equipment newEsp = Equipment.builder()
                .id(11L).assetTag("ESP-NEW").equipmentType(esp32Type)
                .serialNumber("NEW999").active(true).build();
            when(equipmentRepository.findById(11L)).thenReturn(Optional.of(newEsp));

            equipmentKitService.swapEsp(1L, new SwapEspRequest(11L, null, null)); // default: devolver ao estoque

            // Sensor now points at the new gateway serial on the same port.
            assertThat(sensor.getCodigoSensor()).isEqualTo("NEW999|3");
            assertThat(sensor.getParentEquipment()).isEqualTo(newEsp);
            assertThat(sensor.getPontoGas()).isEqualTo(point);
            // Old ESP volta pro estoque: sai do kit mas continua ATIVO, credencial só parqueada.
            assertThat(oldEsp.getActive()).isTrue();
            assertThat(oldEsp.getEquipmentKit()).isNull();
            assertThat(newEsp.getEquipmentKit()).isEqualTo(testKit);
            verify(deviceProvisioningService).provisionInIoTCore(newEsp);
            verify(deviceProvisioningService).deactivateCredential(oldEsp);
            verify(deviceProvisioningService, never()).revokeCredential(oldEsp);
        }

        @Test
        void should_RetireOldEsp_When_RetireRequested() {
            Equipment newEsp = Equipment.builder()
                .id(11L).assetTag("ESP-NEW").equipmentType(esp32Type)
                .serialNumber("NEW999").active(true).build();
            when(equipmentRepository.findById(11L)).thenReturn(Optional.of(newEsp));

            equipmentKitService.swapEsp(1L, new SwapEspRequest(11L, true, null)); // aposentar

            // ESP com defeito: sai da frota — desativado e credencial revogada.
            assertThat(oldEsp.getActive()).isFalse();
            assertThat(oldEsp.getEquipmentKit()).isNull();
            verify(deviceProvisioningService).revokeCredential(oldEsp);
            verify(deviceProvisioningService, never()).deactivateCredential(oldEsp);
        }

        @Test
        void should_Reject_When_KitNotLive() {
            testKit.setStatus(KitStatus.PENDING);

            assertThatThrownBy(() -> equipmentKitService.swapEsp(1L, new SwapEspRequest(11L, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("INSTALLED or MAINTENANCE");
        }

        @Test
        void should_Reject_When_ReplacementAlreadyAssigned() {
            Equipment busyEsp = Equipment.builder()
                .id(11L).assetTag("ESP-BUSY").equipmentType(esp32Type)
                .serialNumber("NEW999").active(true).equipmentKit(testKit).build();
            when(equipmentRepository.findById(11L)).thenReturn(Optional.of(busyEsp));

            assertThatThrownBy(() -> equipmentKitService.swapEsp(1L, new SwapEspRequest(11L, null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already assigned");
        }

        @Test
        void should_KeepSameCodigo_When_SensorSwapped() {
            Equipment newSensor = Equipment.builder()
                .id(21L).assetTag("SEN-2").equipmentType(sensorType)
                .active(true).build();
            when(equipmentRepository.findById(21L)).thenReturn(Optional.of(newSensor));

            equipmentKitService.swapSensor(1L, new SwapSensorRequest(20L, 21L, null, null));

            // Same port, same point, same codigo -> reading stream is uninterrupted.
            assertThat(newSensor.getCodigoSensor()).isEqualTo("OLD123|3");
            assertThat(newSensor.getSensorPort()).isEqualTo(3);
            assertThat(newSensor.getPontoGas()).isEqualTo(point);
            assertThat(newSensor.getEquipmentKit()).isEqualTo(testKit);
            // Default: sensor velho volta pro estoque (sai do kit/ponto mas continua ativo).
            assertThat(sensor.getActive()).isTrue();
            assertThat(sensor.getEquipmentKit()).isNull();
            assertThat(sensor.getPontoGas()).isNull();
        }
    }
}
