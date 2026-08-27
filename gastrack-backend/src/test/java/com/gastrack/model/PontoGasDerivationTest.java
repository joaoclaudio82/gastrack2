package com.gastrack.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Volume e pressão da linha saem dos cilindros instalados — um sensor mede a saída
 * combinada do manifold, então a autonomia tem que enxergar todos os cascos.
 */
class PontoGasDerivationTest {

    private Cylinder cylinder(BigDecimal liters, BigDecimal capacityBar, GasType gas, boolean active) {
        return cylinder(liters, capacityBar, gas, active, true);
    }

    private Cylinder cylinder(BigDecimal liters, BigDecimal capacityBar, GasType gas,
                              boolean active, boolean connected) {
        return Cylinder.builder()
            .active(active)
            .connected(connected)
            .cylinderModel(CylinderModel.builder()
                .waterVolumeLiters(liters)
                .capacityBar(capacityBar)
                .gasType(gas)
                .build())
            .build();
    }

    private PontoGas pointWith(List<Cylinder> cylinders) {
        return PontoGas.builder()
            .cylinders(cylinders)
            .build();
    }

    @Test
    @DisplayName("3 cilindros de 50L somam 150L — não o 5L padrão da linha")
    void should_SumVolumeOfAllCylinders_When_PointHasSeveral() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true),
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true),
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true)));

        assertThat(point.getEffectiveCapacityLiters()).isEqualByComparingTo("150");
    }

    @Test
    @DisplayName("Cilindro inativo não entra no volume")
    void should_IgnoreInactiveCylinders_When_SummingVolume() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true),
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, false)));

        assertThat(point.getEffectiveCapacityLiters()).isEqualByComparingTo("50");
    }

    @Test
    @DisplayName("Reserva de válvula fechada não entra no volume nem na pressão")
    void should_IgnoreDisconnectedCylinders_When_DerivingLine() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true, true),
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true, true),
            // Reserva fechada: não está na pressão do manifold, então não conta.
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(150), GasType.O2, true, false)));

        assertThat(point.getEffectiveCapacityLiters()).isEqualByComparingTo("100");
        // 150 bar do casco fechado não pode puxar o teto da linha para baixo.
        assertThat(point.getEffectiveFullTankPressureBar()).isEqualByComparingTo("200");
    }

    @Test
    @DisplayName("Linha com todos os cascos fechados não tem capacidade")
    void should_HaveNoCapacity_When_EveryCylinderIsDisconnected() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true, false)));

        assertThat(point.getEffectiveCapacityLiters()).isNull();
        assertThat(point.getGasType()).isNull();
    }

    @Test
    @DisplayName("Sem cilindro a linha não tem volume nem pressão de 100%")
    void should_HaveNoDerivedValues_When_NoCylinderInstalled() {
        // Litragem sem casco é ficção: a linha é só tubulação. Antes daqui saía o
        // fallback gravado, que chegou a produzir nível e alarme fabricados numa
        // linha real com sensor publicando e zero casco cadastrado.
        PontoGas point = pointWith(List.of());

        assertThat(point.getEffectiveCapacityLiters()).isNull();
        assertThat(point.getEffectiveFullTankPressureBar()).isNull();
        assertThat(point.getAvailableCubicMeters()).isNull();
    }

    @Test
    @DisplayName("Pressão de 100% é a do casco mais fraco — não dá para encher acima dele")
    void should_UseLowestCapacityBar_When_ModelsDiffer() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true),
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(150), GasType.O2, true)));

        assertThat(point.getEffectiveFullTankPressureBar()).isEqualByComparingTo("150");
    }

    @Test
    @DisplayName("m³ disponível por Boyle: litros x bar / 1000")
    void should_DeriveCubicMeters_When_PressureKnown() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true),
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true)));
        point.setCurrentPressureBar(BigDecimal.valueOf(100));

        // 100 L x 100 bar / 1000 = 10 m³
        assertThat(point.getAvailableCubicMeters()).isEqualByComparingTo("10");
    }

    @Test
    @DisplayName("Sem leitura não há m³ para reportar")
    void should_ReturnNullCubicMeters_When_NoReading() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.O2, true)));

        assertThat(point.getAvailableCubicMeters()).isNull();
    }

    @Test
    @DisplayName("Gás da linha vem dos cilindros instalados")
    void should_DeriveGasType_When_CylindersInstalled() {
        PontoGas point = pointWith(List.of(
            cylinder(BigDecimal.valueOf(50), BigDecimal.valueOf(200), GasType.N2, true)));

        assertThat(point.getGasType()).isEqualTo(GasType.N2);
        assertThat(pointWith(List.of()).getGasType()).isNull();
    }
}
