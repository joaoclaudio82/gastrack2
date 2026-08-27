package com.gastrack.dto.pontogas;

import com.gastrack.model.CylinderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Client-facing monitoring view of a gas point.
 * {@code effectiveStatus} is "SEM_SINAL" when the reading is stale, otherwise the calculated status.
 */
public record PontoGasMonitoringResponse(
    Long id,
    String location,
    Long addressId,
    String addressName,
    BigDecimal currentPressureBar,
    BigDecimal fullTankPressureBar,
    /** Soma do volume dos cilindros instalados — é o que a autonomia precisa considerar. */
    BigDecimal capacityLiters,
    /** Gás disponível em m³ (Boyle). Multiplicado pelo preço/m³ dá o valor em estoque. */
    BigDecimal availableCubicMeters,
    Double fillPercentage,
    LocalDateTime lastReadingAt,
    CylinderStatus status,
    boolean isStale,
    String effectiveStatus,
    List<MonitoringCylinderView> cylinders
) {
    public record MonitoringCylinderView(
        Long id,
        String serialNumber,
        com.gastrack.model.GasType gasType,
        BigDecimal volumeLiters
    ) {}
}
