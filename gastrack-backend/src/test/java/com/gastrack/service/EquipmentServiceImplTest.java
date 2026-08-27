package com.gastrack.service;

import com.gastrack.dto.equipment.*;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.EquipmentMapper;
import com.gastrack.model.*;
import com.gastrack.repository.DeviceCredentialRepository;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.EquipmentTypeRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.MovementHistoryService;
import com.gastrack.service.impl.EquipmentServiceImpl;
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
class EquipmentServiceImplTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EquipmentKitRepository equipmentKitRepository;

    @Mock
    private EquipmentTypeRepository equipmentTypeRepository;

    @Mock
    private EquipmentMapper equipmentMapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @Mock
    private UserService userService;

    @Mock
    private MovementHistoryService movementHistoryService;

    @Mock
    private DeviceProvisioningService deviceProvisioningService;

    @Mock
    private DeviceCredentialRepository deviceCredentialRepository;

    @InjectMocks
    private EquipmentServiceImpl equipmentService;

    private MockedStatic<TenantContext> tenantContextMock;

    private Company testCompany;
    private Contract testContract;
    private EquipmentKit testKit;
    private EquipmentType testType;
    private Equipment testEquipment;
    private EquipmentRequest testRequest;
    private EquipmentResponse testResponse;
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
            .build();

        testKit = EquipmentKit.builder()
            .id(1L)
            .contract(testContract)
            .kitCode("KIT-001")
            .status(KitStatus.INSTALLED)
            .active(true)
            .equipments(new ArrayList<>())
            .build();

        testType = EquipmentType.builder()
            .id(1L)
            .name("Sensor de Pressão")
            .description("Sensor para monitoramento")
            .active(true)
            .build();

        testEquipment = Equipment.builder()
            .id(1L)
            .equipmentKit(testKit)
            .equipmentType(testType)
            .assetTag("EQ-001")
            .description("Test equipment")
            .serialNumber(null)
            .manufacturer("Test Manufacturer")
            .model("Model X")
            .condition(EquipmentCondition.NEW)
            .active(true)
            .createdBy(testUser)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testRequest = new EquipmentRequest(
            1L,
            1L,
            "EQ-001",
            "Test equipment",
            null,
            "Test Manufacturer",
            "Model X",
            null,
            LocalDate.now(),
            LocalDate.now().plusYears(1),
            EquipmentCondition.NEW,
            "Test notes"
        );

        testResponse = new EquipmentResponse(
            1L,
            1L,
            "KIT-001",
            1L,
            "Sensor de Pressão",
            1L,
            "Test Company",
            "EQ-001",
            "Test equipment",
            null,
            "Test Manufacturer",
            "Model X",
            null,
            LocalDate.now(),
            LocalDate.now().plusYears(1),
            EquipmentCondition.NEW,
            "Test notes",
            true,
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
    void should_CreateEquipment_When_SuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
        tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.existsByAssetTag("EQ-001")).thenReturn(false);
        when(equipmentMapper.toEntity(testRequest)).thenReturn(testEquipment);
        when(userService.findById(1L)).thenReturn(testUser);
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);
        when(equipmentMapper.toResponse(testEquipment)).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.assetTag()).isEqualTo("EQ-001");
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void should_DelegateProvisioning_When_CreatingEsp32() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
        tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

        EquipmentRequest esp32Request = buildEsp32Request();
        Equipment esp32Equipment = buildEsp32Equipment();
        EquipmentResponse esp32Response = buildEsp32Response();

        when(equipmentTypeRepository.findById(99L)).thenReturn(Optional.of(esp32Equipment.getEquipmentType()));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.existsByAssetTag("ESP-001")).thenReturn(false);
        when(equipmentRepository.findActiveBySerialNumber("4036EB1815AC")).thenReturn(List.of());
        when(equipmentMapper.toEntity(esp32Request)).thenReturn(esp32Equipment);
        when(userService.findById(1L)).thenReturn(testUser);
        when(equipmentRepository.findByEquipmentKitIdAndActive(1L, true)).thenReturn(List.of());
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(esp32Equipment);
        when(equipmentMapper.toResponse(esp32Equipment)).thenReturn(esp32Response);

        EquipmentResponse result = equipmentService.create(esp32Request);

        assertThat(result).isNotNull();
        assertThat(result.assetTag()).isEqualTo("ESP-001");
        verify(equipmentRepository).save(any(Equipment.class));
        // Provisioning is delegated unconditionally for ESP32; dev-credential handling
        // (SdkClientException swallow) lives inside DeviceProvisioningServiceImpl, not here.
        verify(deviceProvisioningService).provisionInIoTCore(esp32Equipment);
    }

    @Test
    void should_PropagateProvisioningError_When_CreatingEsp32AndProvisioningFails() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);
        tenantContextMock.when(TenantContext::getCurrentUserId).thenReturn(1L);

        EquipmentRequest esp32Request = buildEsp32Request();
        Equipment esp32Equipment = buildEsp32Equipment();

        when(equipmentTypeRepository.findById(99L)).thenReturn(Optional.of(esp32Equipment.getEquipmentType()));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.existsByAssetTag("ESP-001")).thenReturn(false);
        when(equipmentRepository.findActiveBySerialNumber("4036EB1815AC")).thenReturn(List.of());
        when(equipmentMapper.toEntity(esp32Request)).thenReturn(esp32Equipment);
        when(userService.findById(1L)).thenReturn(testUser);
        when(equipmentRepository.findByEquipmentKitIdAndActive(1L, true)).thenReturn(List.of());
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(esp32Equipment);
        doThrow(new BusinessException("IoT Core provisioning failed: boom"))
            .when(deviceProvisioningService).provisionInIoTCore(any(Equipment.class));

        // Real IoT Core errors are no longer swallowed by the service.
        assertThatThrownBy(() -> equipmentService.create(esp32Request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("IoT Core provisioning failed");
    }

    @Test
    void should_ThrowException_When_NotSuperAdminCreating() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);

        assertThatThrownBy(() -> equipmentService.create(testRequest))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessageContaining("SUPER_ADMIN");
    }

    @Test
    void should_ThrowException_When_AssetTagExists() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.existsByAssetTag("EQ-001")).thenReturn(true);

        assertThatThrownBy(() -> equipmentService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("asset tag already exists");
    }

    @Test
    void should_FindById_When_SuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentMapper.toResponse(testEquipment)).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.findById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void should_ValidateCompanyAccess_When_NotSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);
        tenantContextMock.when(TenantContext::getCurrentCompanyId).thenReturn(1L);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentMapper.toResponse(testEquipment)).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.findById(1L);

        assertThat(result).isNotNull();
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_FindAll_ForSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<Equipment> equipmentPage = new PageImpl<>(List.of(testEquipment));
        when(equipmentRepository.search(-1L, -1L, -1L, null, "", pageable)).thenReturn(equipmentPage);
        when(equipmentMapper.toResponse(testEquipment)).thenReturn(testResponse);

        Page<EquipmentResponse> result = equipmentService.findAll(pageable, null, null, null, null, null);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_FindUnassigned_ForSuperAdminOnly() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testEquipment.setEquipmentKit(null);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Equipment> equipmentPage = new PageImpl<>(List.of(testEquipment));
        when(equipmentRepository.findUnassigned(pageable)).thenReturn(equipmentPage);
        when(equipmentMapper.toResponse(testEquipment)).thenReturn(testResponse);

        Page<EquipmentResponse> result = equipmentService.findUnassigned(pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_ThrowException_When_NotSuperAdminFindingUnassigned() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);

        Pageable pageable = PageRequest.of(0, 10);

        assertThatThrownBy(() -> equipmentService.findUnassigned(pageable))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_AssignToKit_When_Valid() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testEquipment.setEquipmentKit(null);  // Not assigned yet
        EquipmentAssignRequest assignRequest = new EquipmentAssignRequest(1L);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.assignToKit(1L, assignRequest);

        assertThat(result).isNotNull();
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void should_ThrowException_When_AlreadyAssigned() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentAssignRequest assignRequest = new EquipmentAssignRequest(1L);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));

        assertThatThrownBy(() -> equipmentService.assignToKit(1L, assignRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("already assigned");
    }

    @Test
    void should_RemoveFromKit_When_Assigned() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.removeFromKit(1L);

        assertThat(result).isNotNull();
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void should_Transfer_When_Valid() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentKit targetKit = EquipmentKit.builder()
            .id(2L)
            .contract(testContract)
            .kitCode("KIT-002")
            .status(KitStatus.INSTALLED)
            .active(true)
            .build();

        EquipmentTransferRequest transferRequest = new EquipmentTransferRequest(2L, "Transfer notes");

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentKitRepository.findById(2L)).thenReturn(Optional.of(targetKit));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.transfer(1L, transferRequest);

        assertThat(result).isNotNull();
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void should_ThrowException_When_TransferNotAssigned() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        testEquipment.setEquipmentKit(null);
        EquipmentTransferRequest transferRequest = new EquipmentTransferRequest(2L, "Notes");

        EquipmentKit targetKit = EquipmentKit.builder()
            .id(2L)
            .contract(testContract)
            .kitCode("KIT-002")
            .status(KitStatus.INSTALLED)
            .active(true)
            .build();

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentKitRepository.findById(2L)).thenReturn(Optional.of(targetKit));

        assertThatThrownBy(() -> equipmentService.transfer(1L, transferRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("not assigned");
    }

    @Test
    void should_DeactivateEquipment_When_SuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

        equipmentService.deactivate(1L);

        assertThat(testEquipment.getActive()).isFalse();
        verify(equipmentRepository).save(testEquipment);
    }

    @Test
    void should_RevokeCredential_When_DeactivatingEsp32() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentType esp32Type = EquipmentType.builder().id(99L).name("ESP32").active(true).build();
        Equipment esp32 = Equipment.builder()
            .id(9L).equipmentType(esp32Type).assetTag("ESP-9").serialNumber("SER9").active(true).build();
        when(equipmentRepository.findById(9L)).thenReturn(Optional.of(esp32));

        equipmentService.deactivate(9L);

        assertThat(esp32.getActive()).isFalse();
        verify(deviceProvisioningService).revokeCredential(esp32);
    }

    @Test
    void should_NotRevokeCredential_When_DeactivatingSensor() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentType sensorType = EquipmentType.builder().id(50L).name("Sensor").active(true).build();
        Equipment sensor = Equipment.builder()
            .id(10L).equipmentType(sensorType).assetTag("SEN-10").serialNumber("SEN10").active(true).build();
        when(equipmentRepository.findById(10L)).thenReturn(Optional.of(sensor));

        equipmentService.deactivate(10L);

        verify(deviceProvisioningService, never()).revokeCredential(any(Equipment.class));
    }

    @Test
    void should_ThrowException_When_NotSuperAdminDeactivating() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));

        assertThatThrownBy(() -> equipmentService.deactivate(1L))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_DeleteCredentialAndNotReprovision_When_UpdatingEsp32ToNonEsp32() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentType esp32Type = buildEsp32Type();
        Equipment esp32Equipment = Equipment.builder()
            .id(1L)
            .equipmentType(esp32Type)
            .equipmentKit(testKit)
            .assetTag("ESP-001")
            .serialNumber("4036EB1815AC")
            .active(true)
            .build();
        DeviceCredential orphanCredential = DeviceCredential.builder().id(5L).build();

        // Request now targets a non-ESP32 type (testType id 1L, no serial)
        EquipmentRequest toSensorRequest = new EquipmentRequest(
            1L, 1L, "ESP-001", "Now a sensor", null,
            "Espressif", "ESP32", null, LocalDate.now(), LocalDate.now().plusYears(1),
            EquipmentCondition.NEW, "Test"
        );

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(esp32Equipment));
        when(equipmentTypeRepository.findById(1L)).thenReturn(Optional.of(testType));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(deviceCredentialRepository.findByEquipmentId(1L)).thenReturn(Optional.of(orphanCredential));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(esp32Equipment);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        equipmentService.update(1L, toSensorRequest);

        verify(deviceCredentialRepository).delete(orphanCredential);
        verify(deviceProvisioningService, never()).provisionInIoTCore(any(Equipment.class));
    }

    @Test
    void should_Reprovision_When_UpdatingEsp32WithMissingCredential() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentType esp32Type = buildEsp32Type();
        Equipment esp32Equipment = Equipment.builder()
            .id(1L)
            .equipmentType(esp32Type)
            .equipmentKit(testKit)
            .assetTag("ESP-001")
            .serialNumber("4036EB1815AC")
            .active(true)
            .build();

        EquipmentRequest esp32Request = new EquipmentRequest(
            1L, 99L, "ESP-001", "ESP32 device", "4036EB1815AC",
            "Espressif", "ESP32", null, LocalDate.now(), LocalDate.now().plusYears(1),
            EquipmentCondition.NEW, "Test"
        );

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(esp32Equipment));
        when(equipmentTypeRepository.findById(99L)).thenReturn(Optional.of(esp32Type));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.findActiveBySerialNumber("4036EB1815AC")).thenReturn(List.of(esp32Equipment));
        when(equipmentRepository.findByEquipmentKitIdAndActive(1L, true)).thenReturn(List.of());
        // Already ESP32 (wasEsp32 == true) but no credential yet -> must reprovision
        when(deviceCredentialRepository.findByEquipmentId(1L)).thenReturn(Optional.empty());
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(esp32Equipment);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        equipmentService.update(1L, esp32Request);

        verify(deviceProvisioningService).provisionInIoTCore(esp32Equipment);
        verify(deviceCredentialRepository, never()).delete(any(DeviceCredential.class));
    }

    // --- Fatia 4b: kit = 1 ESP32 invariant ---

    @Test
    void should_ThrowException_When_AssigningSecondEsp32ToKit() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentType esp32Type = buildEsp32Type();
        Equipment existingEsp32 = Equipment.builder()
            .id(20L).equipmentType(esp32Type).equipmentKit(testKit)
            .assetTag("ESP-EXIST").serialNumber("AAAA").active(true).build();
        Equipment newEsp32 = Equipment.builder()
            .id(21L).equipmentType(esp32Type)
            .assetTag("ESP-NEW").serialNumber("BBBB").active(true).build(); // unassigned

        EquipmentAssignRequest assignRequest = new EquipmentAssignRequest(1L);

        when(equipmentRepository.findById(21L)).thenReturn(Optional.of(newEsp32));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.findByEquipmentKitIdAndActive(1L, true)).thenReturn(List.of(existingEsp32));

        assertThatThrownBy(() -> equipmentService.assignToKit(21L, assignRequest))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("exactly one ESP32");
        verify(equipmentRepository, never()).save(any(Equipment.class));
    }

    @Test
    void should_AssignFirstEsp32ToKit_When_KitHasNoEsp32() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        EquipmentType esp32Type = buildEsp32Type();
        Equipment newEsp32 = Equipment.builder()
            .id(21L).equipmentType(esp32Type)
            .assetTag("ESP-NEW").serialNumber("BBBB").active(true).build();

        EquipmentAssignRequest assignRequest = new EquipmentAssignRequest(1L);

        when(equipmentRepository.findById(21L)).thenReturn(Optional.of(newEsp32));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.findByEquipmentKitIdAndActive(1L, true)).thenReturn(List.of());
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(newEsp32);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.assignToKit(21L, assignRequest);

        assertThat(result).isNotNull();
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void should_AllowSensorAssignment_When_KitAlreadyHasEsp32() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        // testEquipment uses a non-ESP32 type ("Sensor de Pressão"); sensors never count toward kit=1ESP.
        testEquipment.setEquipmentKit(null);
        EquipmentAssignRequest assignRequest = new EquipmentAssignRequest(1L);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(testEquipment);
        when(equipmentMapper.toResponse(any(Equipment.class))).thenReturn(testResponse);

        EquipmentResponse result = equipmentService.assignToKit(1L, assignRequest);

        assertThat(result).isNotNull();
        // Guard returns early for non-ESP32; the kit's ESP32 inventory is never queried.
        verify(equipmentRepository, never()).findByEquipmentKitIdAndActive(1L, true);
    }

    private EquipmentType buildEsp32Type() {
        return EquipmentType.builder()
            .id(99L)
            .name("ESP32")
            .active(true)
            .build();
    }

    private EquipmentRequest buildEsp32Request() {
        // EquipmentRequest field order: (equipmentKitId, equipmentTypeId, ...). ESP32 type id = 99L.
        return new EquipmentRequest(
            1L, 99L, "ESP-001", "ESP32 device", "4036EB1815AC",
            "Espressif", "ESP32", null, LocalDate.now(), LocalDate.now().plusYears(1),
            EquipmentCondition.NEW, "Test"
        );
    }

    private Equipment buildEsp32Equipment() {
        return Equipment.builder()
            .id(10L)
            .equipmentType(buildEsp32Type())
            .equipmentKit(testKit)
            .assetTag("ESP-001")
            .serialNumber("4036EB1815AC")
            .active(true)
            .build();
    }

    private EquipmentResponse buildEsp32Response() {
        return new EquipmentResponse(
            10L, 1L, "KIT-001", 99L, "ESP32", 1L, "Test Company",
            "ESP-001", "ESP32 device", "4036EB1815AC", "Espressif", "ESP32",
            null, LocalDate.now(), LocalDate.now().plusYears(1), EquipmentCondition.NEW, "Test",
            true, 1L, "Test User", LocalDateTime.now(), LocalDateTime.now()
        );
    }
}
