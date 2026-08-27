package com.gastrack.service;

import com.gastrack.dto.pontogas.PontoGasRequest;
import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.dto.pontogas.PontoGasStatusUpdateRequest;
import com.gastrack.dto.pontogas.SensorAssignment;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.PontoGasMapper;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.CylinderStatus;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentType;
import com.gastrack.model.PontoGas;
import com.gastrack.dto.pontogas.PontoGasMonitoringResponse;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.repository.EquipmentTypeRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.repository.RefillEventRepository;
import com.gastrack.model.RefillEvent;
import com.gastrack.service.impl.PontoGasServiceImpl;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PontoGasServiceImplTest {

    @Mock
    private PontoGasRepository pontoGasRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EquipmentTypeRepository equipmentTypeRepository;

    @Mock
    private RefillEventRepository refillEventRepository;

    @Mock
    private PontoGasMapper pontoGasMapper;

    @Mock
    private TenantSecurityService tenantSecurityService;

    @Mock
    private CylinderStatusCalculator statusCalculator;

    @Mock
    private CylinderRepository cylinderRepository;

    @InjectMocks
    private PontoGasServiceImpl pontoGasService;

    private Company testCompany;
    private Address testAddress;
    private PontoGas testPontoGas;
    private PontoGasRequest testRequest;
    private PontoGasResponse testResponse;

    @BeforeEach
    void setUp() {
        testCompany = Company.builder()
            .id(1L)
            .name("Test Company")
            .slug("test-company")
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testAddress = Address.builder()
            .id(10L)
            .company(testCompany)
            .name("Address 1")
            .street("Street 1")
            .zipCode("00000-000")
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testPontoGas = PontoGas.builder()
            .id(100L)
            .address(testAddress)
            .location("Ponto 1")
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        testRequest = new PontoGasRequest(
            10L,
            "Ponto 1",
            null,
            null
        );

        testResponse = new PontoGasResponse(
            100L,
            10L,
            "Address 1",
            "Ponto 1",
            null,
            null,
            new PontoGasResponse.ThresholdsView(20, 50, 80),
            null,
            null,
            CylinderStatus.UNKNOWN,
            true,
            LocalDateTime.now(),
            LocalDateTime.now(),
            null,
            List.of(),
            null,
            null,
            null
        );
    }

    @Test
    void should_ReportSemSinal_When_LastReadingIsStale() {
        testPontoGas.setStatus(CylinderStatus.FULL);
        testPontoGas.setLastReadingAt(LocalDateTime.now(java.time.ZoneOffset.UTC).minusHours(3)); // past global 60min default
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of());

        PontoGasMonitoringResponse result = pontoGasService.getMonitoring(100L);

        assertThat(result.isStale()).isTrue();
        assertThat(result.effectiveStatus()).isEqualTo("SEM_SINAL");
    }

    @Test
    void should_ReportCalculatedStatus_When_ReadingIsFresh() {
        testPontoGas.setStatus(CylinderStatus.FULL);
        testPontoGas.setLastReadingAt(LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(5));
        testPontoGas.setCurrentPressureBar(BigDecimal.valueOf(120));
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        when(statusCalculator.calculateFillPercentage(any(), any())).thenReturn(85.7);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of());

        PontoGasMonitoringResponse result = pontoGasService.getMonitoring(100L);

        assertThat(result.isStale()).isFalse();
        assertThat(result.effectiveStatus()).isEqualTo("FULL");
        assertThat(result.fillPercentage()).isEqualTo(85.7);
    }

    @Test
    void should_UpdatePressureAndStatus_When_ReadingPushed() {
        PontoGasStatusUpdateRequest statusRequest =
            new PontoGasStatusUpdateRequest(BigDecimal.valueOf(70));

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(pontoGasRepository.save(any(PontoGas.class))).thenReturn(testPontoGas);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        PontoGasResponse result = pontoGasService.updateStatus(100L, statusRequest);

        assertThat(result).isNotNull();
        verify(statusCalculator).updatePressureAndStatus(eq(testPontoGas), eq(BigDecimal.valueOf(70)));
        verify(pontoGasRepository).save(testPontoGas);
    }

    @Test
    void should_RecordAutoRefillEvent_When_FillJumpsAboveThreshold() {
        BigDecimal oldPressure = BigDecimal.valueOf(14);   // 10% of 140
        BigDecimal newPressure = BigDecimal.valueOf(126);  // 90% of 140
        testPontoGas.setCurrentPressureBar(oldPressure);
        PontoGasStatusUpdateRequest statusRequest = new PontoGasStatusUpdateRequest(newPressure);

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(statusCalculator.calculateFillPercentage(eq(oldPressure), any())).thenReturn(10.0);
        when(statusCalculator.calculateFillPercentage(eq(newPressure), any())).thenReturn(90.0);
        when(pontoGasRepository.save(any(PontoGas.class))).thenReturn(testPontoGas);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        pontoGasService.updateStatus(100L, statusRequest);

        verify(refillEventRepository).save(any(RefillEvent.class));
    }

    @Test
    void should_NotRecordRefillEvent_When_FillChangeBelowThreshold() {
        BigDecimal oldPressure = BigDecimal.valueOf(70);   // 50%
        BigDecimal newPressure = BigDecimal.valueOf(84);   // 60%
        testPontoGas.setCurrentPressureBar(oldPressure);
        PontoGasStatusUpdateRequest statusRequest = new PontoGasStatusUpdateRequest(newPressure);

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(statusCalculator.calculateFillPercentage(eq(oldPressure), any())).thenReturn(50.0);
        when(statusCalculator.calculateFillPercentage(eq(newPressure), any())).thenReturn(60.0);
        when(pontoGasRepository.save(any(PontoGas.class))).thenReturn(testPontoGas);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        pontoGasService.updateStatus(100L, statusRequest);

        verify(refillEventRepository, never()).save(any(RefillEvent.class));
    }

    @Test
    void should_CreatePontoGas_When_ValidRequest_WithAccessGranted() {
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(pontoGasMapper.toEntity(testRequest)).thenReturn(testPontoGas);
        when(pontoGasRepository.save(any(PontoGas.class))).thenReturn(testPontoGas);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        PontoGasResponse result = pontoGasService.create(testRequest);

        assertThat(result).isNotNull();
        assertThat(result.location()).isEqualTo("Ponto 1");
        verify(pontoGasRepository).save(any(PontoGas.class));
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_CreateAndAssociateSensorOnPort_When_SensorsToAddProvided() {
        EquipmentType sensorType = EquipmentType.builder().id(9L).name("Sensor").build();
        Equipment sensor = Equipment.builder()
            .id(500L).equipmentType(sensorType).sensorPort(1).active(true).build();
        PontoGasRequest req = new PontoGasRequest(
            10L, "Ponto 1", null,
            List.of(new SensorAssignment(42L, 1)));
        PontoGas mapped = PontoGas.builder().address(testAddress).location("Ponto 1").build();

        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        when(pontoGasMapper.toEntity(req)).thenReturn(mapped);
        when(equipmentRepository.findByParentEquipmentIdAndSensorPort(42L, 1))
            .thenReturn(Optional.of(sensor));
        when(equipmentRepository.findById(500L)).thenReturn(Optional.of(sensor));
        when(pontoGasRepository.save(any(PontoGas.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pontoGasMapper.toResponse(any(PontoGas.class))).thenReturn(testResponse);

        pontoGasService.create(req);

        // sensor da porta escolhida fica amarrado ao ponto (usedPorts no front passa a enxergar)
        assertThat(sensor.getPontoGas()).isEqualTo(mapped);
        verify(equipmentRepository).findByParentEquipmentIdAndSensorPort(42L, 1);
    }

    @Test
    void should_ThrowException_When_AddressNotFound_OnCreate() {
        when(addressRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pontoGasService.create(testRequest))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Address");
    }

    @Test
    void should_ThrowAccessDenied_When_CreateForOtherCompany() {
        when(addressRepository.findById(10L)).thenReturn(Optional.of(testAddress));
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> pontoGasService.create(testRequest))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_FindById_When_AccessGranted() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        PontoGasResponse result = pontoGasService.findById(100L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(100L);
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_ThrowAccessDenied_When_FindById_DifferentCompany() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> pontoGasService.findById(100L))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_FindAll_FilteredByCompany_WhenNotSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(tenantSecurityService.requireCompanyContext()).thenReturn(1L);

        Pageable pageable = PageRequest.of(0, 10);
        Page<PontoGas> page = new PageImpl<>(List.of(testPontoGas));
        when(pontoGasRepository.findByAddressCompanyId(1L, pageable)).thenReturn(page);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        Page<PontoGasResponse> result = pontoGasService.findAll(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(pontoGasRepository).findByAddressCompanyId(eq(1L), any(Pageable.class));
    }

    @Test
    void should_FindAll_AllPontosGas_WhenSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        Page<PontoGas> page = new PageImpl<>(List.of(testPontoGas));
        when(pontoGasRepository.findAll(pageable)).thenReturn(page);
        when(pontoGasMapper.toResponse(testPontoGas)).thenReturn(testResponse);

        Page<PontoGasResponse> result = pontoGasService.findAll(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(pontoGasRepository).findAll(pageable);
    }

    @Test
    void should_UpdatePontoGas_When_AccessGranted() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(pontoGasRepository.save(any(PontoGas.class))).thenReturn(testPontoGas);
        when(pontoGasMapper.toResponse(any(PontoGas.class))).thenReturn(testResponse);

        PontoGasResponse result = pontoGasService.update(100L, testRequest);

        assertThat(result).isNotNull();
        verify(pontoGasMapper).updateEntity(eq(testRequest), any(PontoGas.class));
    }

    @Test
    void should_DeactivatePontoGas_When_AccessGranted() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        pontoGasService.deactivate(100L);

        assertThat(testPontoGas.getActive()).isFalse();
        verify(pontoGasRepository).save(testPontoGas);
    }

    @Test
    void should_ActivatePontoGas_When_AccessGranted() {
        testPontoGas.setActive(false);
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        pontoGasService.activate(100L);

        assertThat(testPontoGas.getActive()).isTrue();
        verify(pontoGasRepository).save(testPontoGas);
    }

    @Test
    void should_DeletePontoGas_When_AccessGranted() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);

        pontoGasService.delete(100L);

        verify(tenantSecurityService).validateCompanyAccess(1L);
        verify(pontoGasRepository).delete(testPontoGas);
    }

    @Test
    void should_ThrowResourceNotFound_When_DeletingNonExistingPontoGas() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pontoGasService.delete(100L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("PontoGas");

        verify(pontoGasRepository, never()).delete(any(PontoGas.class));
    }

    @Test
    void should_ThrowAccessDenied_When_DeleteFromOtherCompany() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(testPontoGas));
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> pontoGasService.delete(100L))
            .isInstanceOf(AccessDeniedException.class);

        verify(pontoGasRepository, never()).delete(any(PontoGas.class));
    }
}
