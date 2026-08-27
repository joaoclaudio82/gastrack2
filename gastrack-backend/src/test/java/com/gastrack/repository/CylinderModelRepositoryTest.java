package com.gastrack.repository;

import com.gastrack.model.CylinderModel;
import com.gastrack.model.GasType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CylinderModelRepositoryTest {

    @Autowired
    private CylinderModelRepository repository;

    private CylinderModel model(String codigo) {
        return CylinderModel.builder()
            .codigo(codigo)
            .gasType(GasType.O2)
            .waterVolumeLiters(BigDecimal.valueOf(50))
            .capacityBar(BigDecimal.valueOf(200))
            .active(true)
            .build();
    }

    @Test
    void should_ReturnTrue_When_CodigoExists() {
        repository.save(model("O2-50L-200BAR"));

        assertThat(repository.existsByCodigo("O2-50L-200BAR")).isTrue();
    }

    @Test
    void should_ReturnFalse_When_CodigoNotExists() {
        assertThat(repository.existsByCodigo("NONEXISTENT")).isFalse();
    }

    @Test
    void should_PersistFields_When_Saved() {
        CylinderModel saved = repository.save(model("N2-10L-150BAR"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getGasType()).isEqualTo(GasType.O2);
        assertThat(saved.getWaterVolumeLiters()).isEqualByComparingTo(BigDecimal.valueOf(50));
    }
}
