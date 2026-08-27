package com.gastrack.service;

import com.gastrack.dto.refill.RefillEventResponse;
import com.gastrack.dto.refill.RefillRequest;
import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.RefillEventMapper;
import com.gastrack.model.Address;
import com.gastrack.model.Company;
import com.gastrack.model.Cylinder;
import com.gastrack.model.CylinderModel;
import com.gastrack.model.PontoGas;
import com.gastrack.model.RefillEvent;
import com.gastrack.model.RefillSource;
import com.gastrack.repository.CylinderModelRepository;
import com.gastrack.repository.CylinderRepository;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.repository.RefillEventRepository;
import com.gastrack.service.impl.RefillServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefillServiceImplTest {

    @Mock private RefillEventRepository refillEventRepository;
    @Mock private PontoGasRepository pontoGasRepository;
    @Mock private CylinderRepository cylinderRepository;
    @Mock private CylinderModelRepository cylinderModelRepository;
    @Mock private RefillEventMapper refillEventMapper;
    @Mock private TenantSecurityService tenantSecurityService;
    @Mock private GasLinePolicy gasLinePolicy;

    @InjectMocks private RefillServiceImpl refillService;

    private PontoGas gasPoint;
    private CylinderModel model;
    private RefillRequest request;

    @BeforeEach
    void setUp() {
        Company company = Company.builder().id(1L).name("Co").build();
        Address address = Address.builder().id(10L).company(company).build();
        gasPoint = PontoGas.builder().id(100L).address(address).build();
        model = CylinderModel.builder().id(5L).codigo("M1").build();
        request = new RefillRequest("SN-NEW", 5L, 1L);
    }

    /** Banco de 3 cascos: trocar um não pode aposentar os outros dois. */
    @Test
    void should_RetireOnlyOutgoingCylinder_When_PointIsAManifold() {
        Cylinder outgoing = Cylinder.builder().id(1L).serialNumber("SN-OLD").active(true).build();
        Cylinder keepA = Cylinder.builder().id(2L).serialNumber("SN-A").active(true).build();
        Cylinder keepB = Cylinder.builder().id(3L).serialNumber("SN-B").active(true).build();

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L))
            .thenReturn(List.of(outgoing, keepA, keepB));
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventRepository.save(any(RefillEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventMapper.toResponse(any(RefillEvent.class)))
            .thenReturn(new RefillEventResponse(1L, 100L, null, null, null, RefillSource.MANUAL, 2L, "SN-NEW"));

        refillService.registerRefill(100L, request);

        assertThat(outgoing.getActive()).isFalse();
        assertThat(keepA.getActive()).isTrue();
        assertThat(keepB.getActive()).isTrue();
        verify(cylinderRepository).saveAll(List.of(outgoing));
    }

    @Test
    void should_ThrowNotFound_When_OutgoingCylinderIsNotOnThePoint() {
        Cylinder other = Cylinder.builder().id(9L).serialNumber("SN-OTHER").active(true).build();

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of(other));

        assertThatThrownBy(() -> refillService.registerRefill(100L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Cylinder");

        verify(cylinderRepository, never()).save(any());
    }

    /** Primeira carga: linha sem cilindro aceita troca sem informar quem saiu. */
    @Test
    void should_AcceptRefill_When_PointHasNoCylinderYet() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of());
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventRepository.save(any(RefillEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventMapper.toResponse(any(RefillEvent.class)))
            .thenReturn(new RefillEventResponse(1L, 100L, null, null, null, RefillSource.MANUAL, 2L, "SN-NEW"));

        RefillEventResponse result = refillService.registerRefill(
            100L, new RefillRequest("SN-NEW", 5L, null));

        assertThat(result.source()).isEqualTo(RefillSource.MANUAL);
        verify(cylinderRepository, never()).saveAll(any());
    }

    @Test
    void should_RequireOutgoingCylinder_When_PointHasCylinders() {
        Cylinder onPoint = Cylinder.builder().id(1L).serialNumber("SN-OLD").active(true).build();

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of(onPoint));

        assertThatThrownBy(() -> refillService.registerRefill(
            100L, new RefillRequest("SN-NEW", 5L, null)))
            .isInstanceOf(com.gastrack.exceptions.BusinessException.class)
            .hasMessageContaining("which cylinder");
    }

    /**
     * Regressão: a invariante de gás único por manifold estava só no cadastro de cilindro.
     * A troca cria cilindro por outro caminho e passava direto — um USER numa linha de O₂
     * podia escolher um modelo de N₂ no dropdown.
     */
    @Test
    void should_ValidateGasTypeAgainstTheLine_When_RegisteringRefill() {
        Cylinder outgoing = Cylinder.builder().id(1L).serialNumber("SN-OLD").active(true).build();

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        doThrow(new ConflictException("Gas point already has cylinders of gas type O2"))
            .when(gasLinePolicy).validateGasTypeMatchesLine(gasPoint, model, 1L);

        assertThatThrownBy(() -> refillService.registerRefill(100L, request))
            .isInstanceOf(ConflictException.class);

        // A validação vem ANTES de aposentar o casco antigo — senão a linha ficaria sem ele.
        verify(cylinderRepository, never()).saveAll(any());
        verify(cylinderRepository, never()).save(any());
    }

    /** O casco novo entra aberto: senão a linha perderia volume depois de uma troca. */
    @Test
    void should_CreateNewCylinderConnected_When_RefillRegistered() {
        Cylinder outgoing = Cylinder.builder().id(1L).serialNumber("SN-OLD").active(true).build();

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of(outgoing));
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventRepository.save(any(RefillEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventMapper.toResponse(any(RefillEvent.class)))
            .thenReturn(new RefillEventResponse(1L, 100L, null, null, null, RefillSource.MANUAL, 2L, "SN-NEW"));

        refillService.registerRefill(100L, request);

        ArgumentCaptor<Cylinder> captor = ArgumentCaptor.forClass(Cylinder.class);
        verify(cylinderRepository).save(captor.capture());
        assertThat(captor.getValue().getConnected()).isTrue();
    }

    @Test
    void should_CreateCylinderAndCloseOldAndRecordManualEvent_When_RefillRegistered() {
        Cylinder oldCylinder = Cylinder.builder().id(1L).serialNumber("SN-OLD").active(true).build();

        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(false);
        when(cylinderRepository.findByPontoGasIdAndActiveTrue(100L)).thenReturn(List.of(oldCylinder));
        when(cylinderRepository.save(any(Cylinder.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventRepository.save(any(RefillEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(refillEventMapper.toResponse(any(RefillEvent.class)))
            .thenReturn(new RefillEventResponse(1L, 100L, null, null, null, RefillSource.MANUAL, 2L, "SN-NEW"));

        RefillEventResponse result = refillService.registerRefill(100L, request);

        assertThat(result.source()).isEqualTo(RefillSource.MANUAL);
        assertThat(oldCylinder.getActive()).isFalse();
        verify(cylinderRepository).saveAll(List.of(oldCylinder));

        ArgumentCaptor<Cylinder> cylinderCaptor = ArgumentCaptor.forClass(Cylinder.class);
        verify(cylinderRepository).save(cylinderCaptor.capture());
        assertThat(cylinderCaptor.getValue().getSerialNumber()).isEqualTo("SN-NEW");
        assertThat(cylinderCaptor.getValue().getActive()).isTrue();
        assertThat(cylinderCaptor.getValue().getPontoGas()).isEqualTo(gasPoint);
        // company é NOT NULL no banco desde a V45; sem isto o insert só quebra em runtime,
        // porque o mock de save() não valida a constraint.
        assertThat(cylinderCaptor.getValue().getCompany())
            .isEqualTo(gasPoint.getAddress().getCompany());

        ArgumentCaptor<RefillEvent> eventCaptor = ArgumentCaptor.forClass(RefillEvent.class);
        verify(refillEventRepository).save(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getSource()).isEqualTo(RefillSource.MANUAL);
        assertThat(eventCaptor.getValue().getCylinder().getSerialNumber()).isEqualTo("SN-NEW");
        assertThat(eventCaptor.getValue().getGasPoint()).isEqualTo(gasPoint);
    }

    @Test
    void should_ThrowConflict_When_SerialAlreadyExists() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(cylinderModelRepository.findById(5L)).thenReturn(Optional.of(model));
        when(cylinderRepository.existsBySerialNumber("SN-NEW")).thenReturn(true);

        assertThatThrownBy(() -> refillService.registerRefill(100L, request))
            .isInstanceOf(ConflictException.class);

        verify(refillEventRepository, never()).save(any());
    }

    @Test
    void should_ThrowNotFound_When_GasPointMissing() {
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refillService.registerRefill(100L, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("PontoGas");
    }

    @Test
    void should_ReturnHistory_When_FindByGasPoint() {
        RefillEvent event = RefillEvent.builder().id(1L).gasPoint(gasPoint).source(RefillSource.AUTO).build();
        when(pontoGasRepository.findById(100L)).thenReturn(Optional.of(gasPoint));
        when(refillEventRepository.findByGasPointIdOrderByDetectedAtDesc(100L)).thenReturn(List.of(event));
        when(refillEventMapper.toResponse(event))
            .thenReturn(new RefillEventResponse(1L, 100L, null, null, null, RefillSource.AUTO, null, null));

        List<RefillEventResponse> result = refillService.findByGasPoint(100L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).source()).isEqualTo(RefillSource.AUTO);
    }
}
