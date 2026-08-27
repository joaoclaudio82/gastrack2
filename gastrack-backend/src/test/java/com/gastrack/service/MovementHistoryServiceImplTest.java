package com.gastrack.service;

import com.gastrack.dto.movementhistory.MovementHistoryResponse;
import com.gastrack.mapper.MovementHistoryMapper;
import com.gastrack.model.*;
import com.gastrack.repository.EquipmentKitRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.MovementHistoryRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.impl.MovementHistoryServiceImpl;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MovementHistoryServiceImplTest {

    @Mock
    private MovementHistoryRepository movementHistoryRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EquipmentKitRepository equipmentKitRepository;

    @Mock
    private MovementHistoryMapper movementHistoryMapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @InjectMocks
    private MovementHistoryServiceImpl movementHistoryService;

    private MockedStatic<TenantContext> tenantContextMock;

    private Company testCompany;
    private Contract testContract;
    private EquipmentKit testKit;
    private EquipmentType testType;
    private Equipment testEquipment;
    private MovementHistory testHistory;
    private MovementHistoryResponse testResponse;
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
            .build();

        testType = EquipmentType.builder()
            .id(1L)
            .name("Sensor de Pressão")
            .active(true)
            .build();

        testEquipment = Equipment.builder()
            .id(1L)
            .equipmentKit(testKit)
            .equipmentType(testType)
            .assetTag("EQ-001")
            .condition(EquipmentCondition.NEW)
            .active(true)
            .build();

        testHistory = MovementHistory.builder()
            .id(1L)
            .equipment(testEquipment)
            .equipmentKit(testKit)
            .user(testUser)
            .operation(MovementOperation.CREATED)
            .operationAt(LocalDateTime.now())
            .notes("Equipment created")
            .build();

        testResponse = new MovementHistoryResponse(
            1L,
            1L,
            "EQ-001",
            1L,
            "KIT-001",
            1L,
            "Test User",
            MovementOperation.CREATED,
            LocalDateTime.now(),
            null,
            null,
            null,
            null,
            "Equipment created"
        );
    }

    @AfterEach
    void tearDown() {
        tenantContextMock.close();
    }

    @Test
    void should_FindByEquipment_When_SuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<MovementHistory> historyPage = new PageImpl<>(List.of(testHistory));
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(movementHistoryRepository.findByEquipmentId(1L, pageable)).thenReturn(historyPage);
        when(movementHistoryMapper.toResponse(testHistory)).thenReturn(testResponse);

        Page<MovementHistoryResponse> result = movementHistoryService.findByEquipment(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).operation()).isEqualTo(MovementOperation.CREATED);
    }

    @Test
    void should_ValidateAccess_When_NotSuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(false);
        tenantContextMock.when(TenantContext::getCurrentCompanyId).thenReturn(1L);

        Pageable pageable = PageRequest.of(0, 10);
        Page<MovementHistory> historyPage = new PageImpl<>(List.of(testHistory));
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(testEquipment));
        when(movementHistoryRepository.findByEquipmentId(1L, pageable)).thenReturn(historyPage);
        when(movementHistoryMapper.toResponse(testHistory)).thenReturn(testResponse);

        Page<MovementHistoryResponse> result = movementHistoryService.findByEquipment(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_FindByKit_When_SuperAdmin() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<MovementHistory> historyPage = new PageImpl<>(List.of(testHistory));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(movementHistoryRepository.findAllRelatedToKit(1L, null, pageable)).thenReturn(historyPage);
        when(movementHistoryMapper.toResponse(testHistory)).thenReturn(testResponse);

        Page<MovementHistoryResponse> result = movementHistoryService.findByKit(1L, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void should_PassOperation_When_FilteringKitHistory() {
        tenantContextMock.when(TenantContext::isSuperAdmin).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<MovementHistory> historyPage = new PageImpl<>(List.of(testHistory));
        when(equipmentKitRepository.findById(1L)).thenReturn(Optional.of(testKit));
        when(movementHistoryRepository.findAllRelatedToKit(1L, MovementOperation.KIT_INSTALLED, pageable))
            .thenReturn(historyPage);
        when(movementHistoryMapper.toResponse(testHistory)).thenReturn(testResponse);

        Page<MovementHistoryResponse> result =
            movementHistoryService.findByKit(1L, MovementOperation.KIT_INSTALLED, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(movementHistoryRepository).findAllRelatedToKit(1L, MovementOperation.KIT_INSTALLED, pageable);
    }

    @Test
    void should_RecordEquipmentCreated() {
        when(movementHistoryRepository.save(any(MovementHistory.class))).thenReturn(testHistory);

        movementHistoryService.recordEquipmentCreated(testEquipment, testUser);

        verify(movementHistoryRepository).save(any(MovementHistory.class));
    }

    @Test
    void should_RecordEquipmentAssignedToKit() {
        when(movementHistoryRepository.save(any(MovementHistory.class))).thenReturn(testHistory);

        movementHistoryService.recordEquipmentAssignedToKit(testEquipment, testKit, testUser);

        verify(movementHistoryRepository).save(any(MovementHistory.class));
    }

    @Test
    void should_RecordEquipmentTransferred() {
        EquipmentKit toKit = EquipmentKit.builder()
            .id(2L)
            .contract(testContract)
            .kitCode("KIT-002")
            .build();

        when(movementHistoryRepository.save(any(MovementHistory.class))).thenReturn(testHistory);

        movementHistoryService.recordEquipmentTransferred(testEquipment, testKit, toKit, testUser, "Transfer notes");

        verify(movementHistoryRepository).save(any(MovementHistory.class));
    }

    @Test
    void should_RecordKitCreated() {
        when(movementHistoryRepository.save(any(MovementHistory.class))).thenReturn(testHistory);

        movementHistoryService.recordKitCreated(testKit, testUser);

        verify(movementHistoryRepository).save(any(MovementHistory.class));
    }

    @Test
    void should_RecordKitStatusChanged_ToInstalled() {
        when(movementHistoryRepository.save(any(MovementHistory.class))).thenReturn(testHistory);

        movementHistoryService.recordKitStatusChanged(testKit, KitStatus.PENDING, KitStatus.INSTALLED, testUser);

        verify(movementHistoryRepository).save(any(MovementHistory.class));
    }
}
