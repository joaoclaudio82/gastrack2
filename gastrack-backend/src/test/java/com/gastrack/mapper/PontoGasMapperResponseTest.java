package com.gastrack.mapper;

import com.gastrack.configuration.CylinderThresholdsConfiguration;
import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.model.Address;
import com.gastrack.model.Cylinder;
import com.gastrack.model.CylinderModel;
import com.gastrack.model.GasType;
import com.gastrack.model.PontoGas;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regressão: a resposta expunha o volume DERIVADO no mesmo campo que o request usa para gravar
 * o fallback. O formulário de edição lê a resposta e a reenvia, então salvar uma linha só para
 * renomear o local escrevia a soma dos cilindros (150 L) por cima do fallback (5 L) — e quando
 * os cascos saíssem, a linha voltava para um banco fantasma.
 *
 * <p>Tudo que a resposta expõe de volume e pressão é derivado dos cascos.
 */
class PontoGasMapperResponseTest {

    private PontoGasMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new PontoGasMapperImpl();
        CylinderThresholdsConfiguration thresholds = new CylinderThresholdsConfiguration();
        ReflectionTestUtils.setField(mapper, "thresholds", thresholds);
    }

    private Cylinder cylinder(int liters, int bar) {
        return Cylinder.builder()
            .active(true)
            .connected(true)
            .cylinderModel(CylinderModel.builder()
                .codigo("O2-" + liters)
                .gasType(GasType.O2)
                .waterVolumeLiters(BigDecimal.valueOf(liters))
                .capacityBar(BigDecimal.valueOf(bar))
                .build())
            .build();
    }

    private PontoGas lineWith3Cylinders() {
        return PontoGas.builder()
            .id(1L)
            .address(Address.builder().id(2L).name("Filial").build())
            .location("Forno")
            .currentPressureBar(BigDecimal.valueOf(92))
            .cylinders(List.of(cylinder(50, 200), cylinder(50, 200), cylinder(50, 200)))
            .build();
    }

    @Test
    @DisplayName("Linha sem casco não tem número nenhum — nem nível fabricado")
    void should_ExposeNoNumbers_When_LineHasNoCylinder() {
        PontoGas line = PontoGas.builder()
            .id(1L)
            .address(Address.builder().id(2L).name("Filial").build())
            .location("Forno")
            .currentPressureBar(BigDecimal.valueOf(40))
            .cylinders(List.of())
            .build();

        PontoGasResponse response = mapper.toResponse(line);

        assertThat(response.effectiveCapacityLiters()).isNull();
        assertThat(response.effectiveFullTankPressureBar()).isNull();
        assertThat(response.availableCubicMeters()).isNull();
        // Sem casco não há referência de 100%: nível tem que ser nulo, não uma
        // divisão pelo fallback de 140 bar.
        assertThat(response.fillPercentage()).isNull();
    }

    @Test
    @DisplayName("Derivados vêm em campos próprios")
    void should_ExposeDerivedValuesSeparately() {
        PontoGasResponse response = mapper.toResponse(lineWith3Cylinders());

        assertThat(response.effectiveCapacityLiters()).isEqualByComparingTo("150");
        assertThat(response.effectiveFullTankPressureBar()).isEqualByComparingTo("200");
        // 150 L x 92 bar / 1000
        assertThat(response.availableCubicMeters()).isEqualByComparingTo("13.8000");
        // 92 / 200
        assertThat(response.fillPercentage()).isEqualTo(46.0);
        assertThat(response.gasType()).isEqualTo(GasType.O2);
    }

    @Test
    @DisplayName("Cascos vêm na resposta, inclusive os fechados")
    void should_ListCylinders_IncludingDisconnected() {
        PontoGas line = lineWith3Cylinders();
        Cylinder closed = cylinder(50, 200);
        closed.setConnected(false);
        line.setCylinders(List.of(line.getCylinders().get(0), closed));

        PontoGasResponse response = mapper.toResponse(line);

        assertThat(response.cylinders()).hasSize(2);
        assertThat(response.effectiveCapacityLiters()).isEqualByComparingTo("50");
    }
}
