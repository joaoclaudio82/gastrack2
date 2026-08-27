package com.gastrack.service;

import com.gastrack.dto.cylinder.CylinderRequest;
import com.gastrack.dto.cylinder.CylinderResponse;
import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ErrorCodes;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.CylinderMapper;
import com.gastrack.mapper.CylinderMapperImpl;
import com.gastrack.model.*;
import com.gastrack.repository.AddressRepository;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.service.impl.CylinderServiceImpl;
import com.gastrack.service.GasLinePolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class CylinderServiceImplTest {

    @Mock private CylinderRepository cylinderRepository;
    @Mock private CylinderModelRepository cylinderModelRepository;
    @Mock private PontoGasRepository pontoGasRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private TenantSecurityService tenantSecurityService;
    @Mock private GasPriceService gasPriceService;

    // Real MapStruct mapper so response derivation (gasType/volume/capacity/price) is exercised.
    private final CylinderMapper cylinderMapper = new CylinderMapperImpl();

    private CylinderServiceImpl cylinderService;

    private Company testCompany;
    private Address testAddress;
    private PontoGas testPontoGas;
    private CylinderModel testModel;
    private Cylinder testCylinder;
    private CylinderRequest testRequest;

    @BeforeEach
    void setUp() {
        cylinderService = new CylinderServiceImpl(
            cylinderRepository, cylinderModelRepository, pontoGasRepository,
            addressRepository, companyRepository, cylinderMapper, tenantSecurityService, gasPriceService,
            new GasLinePolicy(cylinderRepository));

        testCompany = Company.builder().id(1L).name("Test Company").slug("test-company").active(true).build();
        testAddress = Address.builder().id(1L).company(testCompany).name("Filial Centro")
            .street("Rua Principal").zipCode("01000-000").active(true).build();
        testPontoGas = PontoGas.builder().id(20L).address(testAddress).location("Sala 1")
            .active(true).build();
        testModel = CylinderModel.builder().id(10L).codigo("O2-50L-200BAR").gasType(GasType.O2)
            .waterVolumeLiters(BigDecimal.valueOf(50)).capacityBar(BigDecimal.valueOf(200)).active(true).build();

        testCylinder = Cylinder.builder()
            .id(1L).cylinderModel(testModel).company(testCompany).pontoGas(testPontoGas)
            .serialNumber("SERIAL-001").active(true)
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
            .build();

        testRequest = new CylinderRequest(10L, 1L, 20L, null, "SERIAL-001", true);
    }

    private GasPriceResponse priceOf(BigDecimal value) {
        return new GasPriceResponse(5L, 1L, "Test Company", GasType.O2, value, "BRL",
            LocalDateTime.now(), true, LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void should_CreateCylinder_When_ValidRequest_WithModelAndPoint() {
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.existsBySerialNumber("SERIAL-001")).thenReturn(false);
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(12.5)));

        CylinderResponse result = cylinderService.create(testRequest);

        assertThat(result.serialNumber()).isEqualTo("SERIAL-001");
        assertThat(result.companyId()).isEqualTo(1L);
        assertThat(result.companyName()).isEqualTo("Test Company");
        assertThat(result.pontoGasId()).isEqualTo(20L);
        assertThat(result.gasType()).isEqualTo(GasType.O2);
        assertThat(result.waterVolumeLiters()).isEqualByComparingTo("50");
        assertThat(result.capacityBar()).isEqualByComparingTo("200");
        assertThat(result.pricePerM3()).isEqualByComparingTo("12.5");
        verify(cylinderRepository).save(any(Cylinder.class));
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_ThrowNotFound_When_ModelMissing() {
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cylinderService.create(testRequest))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("CylinderModel");
    }

    @Test
    void should_ThrowAccessDenied_When_CreateForOtherCompany() {
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> cylinderService.create(testRequest))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_ThrowConflict_When_SerialNumberExists() {
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.existsBySerialNumber("SERIAL-001")).thenReturn(true);

        assertThatThrownBy(() -> cylinderService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("Serial number")
            // O código é o que o cliente reconhece; a mensagem pode ser reescrita a qualquer hora.
            .extracting(e -> ((ConflictException) e).getErrorCode())
            .isEqualTo(ErrorCodes.CYLINDER_SERIAL_DUPLICATE);
    }

    @Test
    void should_FindById_When_AccessGranted_AndDeriveModelFields() {
        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(9.99)));

        CylinderResponse result = cylinderService.findById(1L);

        assertThat(result.gasType()).isEqualTo(GasType.O2);
        assertThat(result.capacityBar()).isEqualByComparingTo("200");
        assertThat(result.pricePerM3()).isEqualByComparingTo("9.99");
        verify(tenantSecurityService).validateCompanyAccess(1L);
    }

    @Test
    void should_ReturnNullPrice_When_NoCurrentPrice() {
        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(gasPriceService.findCurrent(1L, GasType.O2))
            .thenThrow(new ResourceNotFoundException("GasPrice", "x", "y"));

        CylinderResponse result = cylinderService.findById(1L);

        assertThat(result.pricePerM3()).isNull();
        assertThat(result.gasType()).isEqualTo(GasType.O2);
    }

    @Test
    void should_FindAll_FilteredByCompany_WhenNotSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(false);
        when(tenantSecurityService.requireCompanyContext()).thenReturn(1L);

        Pageable pageable = PageRequest.of(0, 10);
        when(cylinderRepository.search(1L, null, null, "", pageable))
            .thenReturn(new PageImpl<>(List.of(testCylinder)));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.ONE));

        Page<CylinderResponse> result = cylinderService.findAll(pageable, "", null, null);

        assertThat(result.getContent()).hasSize(1);
        verify(cylinderRepository).search(eq(1L), eq(null), eq(null), eq(""), any(Pageable.class));
    }

    @Test
    void should_FindAll_AllCylinders_WhenSuperAdmin() {
        when(tenantSecurityService.isSuperAdmin()).thenReturn(true);

        Pageable pageable = PageRequest.of(0, 10);
        when(cylinderRepository.search(null, null, null, "", pageable))
            .thenReturn(new PageImpl<>(List.of(testCylinder)));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.ONE));

        Page<CylinderResponse> result = cylinderService.findAll(pageable, "", null, null);

        assertThat(result.getContent()).hasSize(1);
        verify(cylinderRepository).search(null, null, null, "", pageable);
    }

    @Test
    void should_ThrowAccessDenied_When_FindById_DifferentCompany() {
        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        doThrow(new AccessDeniedException("Access denied"))
            .when(tenantSecurityService).validateCompanyAccess(1L);

        assertThatThrownBy(() -> cylinderService.findById(1L))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void should_CreateOrphanCylinder_When_CompanyGivenWithoutPoint() {
        // Botijão em estoque: sem ponto/endereço, mas com empresa dona explícita.
        CylinderRequest orphan = new CylinderRequest(10L, 1L, null, null, "SERIAL-STOCK", true);
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.existsBySerialNumber("SERIAL-STOCK")).thenReturn(false);
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(8)));

        CylinderResponse result = cylinderService.create(orphan);

        assertThat(result.companyId()).isEqualTo(1L);
        assertThat(result.pontoGasId()).isNull();
        assertThat(result.pricePerM3()).isEqualByComparingTo("8"); // preço resolvido pela empresa, sem instalação
    }

    @Test
    void should_ThrowConflict_When_CompanyMismatchesPoint() {
        // companyId aponta empresa 2, mas o ponto pertence à empresa 1 → integridade multi-tenant.
        Company otherCompany = Company.builder().id(2L).name("Other").slug("other").active(true).build();
        CylinderRequest mismatched = new CylinderRequest(10L, 2L, 20L, null, "SERIAL-XYZ", true);
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(2L)).thenReturn(Optional.of(otherCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));

        assertThatThrownBy(() -> cylinderService.create(mismatched))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("company");
    }

    @Test
    void should_UpdateCylinder_When_ValidRequest() {
        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(7)));

        CylinderResponse result = cylinderService.update(1L, testRequest);

        assertThat(result.serialNumber()).isEqualTo("SERIAL-001");
        verify(cylinderRepository).save(any(Cylinder.class));
    }

    @Test
    void should_RejectCylinder_When_PointAlreadyHasAnotherGasType() {
        Cylinder nitrogenOnPoint = Cylinder.builder()
            .id(99L)
            .company(testCompany)
            .cylinderModel(CylinderModel.builder().id(11L).codigo("N2-50L").gasType(GasType.N2)
                .waterVolumeLiters(BigDecimal.valueOf(50)).capacityBar(BigDecimal.valueOf(200)).build())
            .active(true)
            .build();

        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.existsBySerialNumber("SERIAL-001")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of(nitrogenOnPoint));

        assertThatThrownBy(() -> cylinderService.create(testRequest))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("N2")
            .extracting(e -> ((ConflictException) e).getErrorCode())
            .isEqualTo(ErrorCodes.GAS_TYPE_MISMATCH);

        verify(cylinderRepository, never()).save(any(Cylinder.class));
    }

    @Test
    void should_AcceptCylinder_When_PointHasSameGasType() {
        Cylinder sameGasOnPoint = Cylinder.builder()
            .id(99L).company(testCompany).cylinderModel(testModel).active(true).build();

        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.existsBySerialNumber("SERIAL-001")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of(sameGasOnPoint));
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(9)));

        CylinderResponse result = cylinderService.create(testRequest);

        assertThat(result.gasType()).isEqualTo(GasType.O2);
    }

    /**
     * Regressão: `connected` era mapeado por expression, e expression é sempre avaliada —
     * `NullValuePropertyMappingStrategy.IGNORE` não a suprime. Como o formulário não envia o
     * campo, editar um casco fechado reabria a válvula em silêncio e devolvia 50 L à linha.
     */
    @Test
    void should_KeepConnectedFalse_When_UpdateRequestOmitsTheField() {
        testCylinder.setConnected(false);

        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of());
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(7)));

        // request sem `connected` — é o que a tela de edição manda hoje
        CylinderResponse result = cylinderService.update(
            1L, new CylinderRequest(10L, 1L, 20L, null, "SERIAL-001", null));

        assertThat(result.connected()).isFalse();
    }

    @Test
    void should_ReopenValve_When_UpdateRequestSaysSo() {
        testCylinder.setConnected(false);

        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of());
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(7)));

        CylinderResponse result = cylinderService.update(
            1L, new CylinderRequest(10L, 1L, 20L, null, "SERIAL-001", true));

        assertThat(result.connected()).isTrue();
    }

    @Test
    void should_MirrorPointAddress_When_CylinderInstalledOnPoint() {
        when(cylinderModelRepository.findById(10L)).thenReturn(Optional.of(testModel));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(pontoGasRepository.findById(20L)).thenReturn(Optional.of(testPontoGas));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.existsBySerialNumber("SERIAL-001")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of());
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(gasPriceService.findCurrent(1L, GasType.O2)).thenReturn(priceOf(BigDecimal.valueOf(9)));

        CylinderResponse result = cylinderService.create(testRequest);

        // Request manda addressId null, mas o cilindro herda o endereço do ponto.
        assertThat(result.addressId()).isEqualTo(testAddress.getId());
    }

    /**
     * Regressão: desativar um casco **preserva** o vínculo com a linha, e a checagem de gás só
     * olha os ativos. Então dava para desativar o N2 da linha, cadastrar um O2 nela, e reativar
     * o N2 — dois gases no mesmo manifold, com a leitura do sensor virando número sem sentido
     * físico. `activate` era o quarto caminho que mexe na composição da linha e o único que não
     * passava pela policy (CONVENTIONS §2).
     */
    @Test
    void should_RejectActivation_When_LineAlreadyOperatesAnotherGas() {
        testCylinder.setActive(false);
        Cylinder oxygenOnLine = Cylinder.builder()
            .id(99L).company(testCompany).pontoGas(testPontoGas).active(true)
            .cylinderModel(CylinderModel.builder().id(11L).codigo("N2-50L").gasType(GasType.N2)
                .waterVolumeLiters(BigDecimal.valueOf(50)).capacityBar(BigDecimal.valueOf(200)).build())
            .build();

        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of(oxygenOnLine));

        assertThatThrownBy(() -> cylinderService.activate(1L))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("N2");

        verify(cylinderRepository, never()).save(any(Cylinder.class));
    }

    @Test
    void should_Activate_When_LineCarriesTheSameGas() {
        testCylinder.setActive(false);

        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(20L)).thenReturn(List.of());
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));

        cylinderService.activate(1L);

        ArgumentCaptor<Cylinder> saved = ArgumentCaptor.forClass(Cylinder.class);
        verify(cylinderRepository).save(saved.capture());
        assertThat(saved.getValue().getActive()).isTrue();
    }

    /** Casco em estoque não tem linha: a policy não tem o que checar e a reativação passa. */
    @Test
    void should_Activate_When_CylinderHasNoLine() {
        testCylinder.setActive(false);
        testCylinder.setPontoGas(null);

        when(cylinderRepository.findById(1L)).thenReturn(Optional.of(testCylinder));
        doNothing().when(tenantSecurityService).validateCompanyAccess(1L);
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));

        cylinderService.activate(1L);

        verify(cylinderRepository).save(any(Cylinder.class));
        verify(cylinderRepository, never()).findByPontoGasIdAndActiveTrue(any());
    }
}
