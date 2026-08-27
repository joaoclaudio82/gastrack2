package com.gastrack.dto.pontogas;

import com.gastrack.model.CylinderStatus;
import com.gastrack.model.GasType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PontoGasResponse(
    Long id,
    Long addressId,
    String addressName,
    String location,
    /** Soma do volume dos cascos conectados. {@code null} quando não há casco. */
    BigDecimal effectiveCapacityLiters,
    /** Menor pressão nominal entre os cascos conectados. {@code null} quando não há casco. */
    BigDecimal effectiveFullTankPressureBar,
    /**
     * Thresholds de nível (% de enchimento) vigentes no servidor. Vão junto da linha para o
     * cliente não redeclarar as faixas — antes o Angular tinha 0.2/0.5/0.8 chumbados.
     */
    ThresholdsView thresholds,
    BigDecimal currentPressureBar,
    LocalDateTime lastReadingAt,
    CylinderStatus status,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<PontoGasEquipmentResponse> equipments,
    /** Cascos do manifold. É deles que sai {@code effectiveCapacityLiters}. */
    List<CylinderView> cylinders,
    /** Gás disponível em m³ (volume × pressão ÷ 1000). Nulo enquanto não há leitura. */
    BigDecimal availableCubicMeters,
    /** Nível em % (pressão ÷ pressão de cheio). Nulo enquanto não há leitura. */
    Double fillPercentage,
    GasType gasType
) {
    public record ThresholdsView(double critical, double low, double normal) {}

    public record CylinderView(
        Long id,
        String serialNumber,
        String modelCodigo,
        GasType gasType,
        BigDecimal waterVolumeLiters,
        BigDecimal capacityBar,
        Boolean connected
    ) {}
}
