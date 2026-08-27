package com.gastrack.service;

import com.gastrack.configuration.CylinderThresholdsConfiguration;
import com.gastrack.model.CylinderStatus;
import com.gastrack.model.PontoGas;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Service for calculating cylinder status based on configurable thresholds.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CylinderStatusCalculator {

    private final CylinderThresholdsConfiguration thresholds;

    /**
     * Calculates the status based on fill percentage and configured thresholds.
     *
     * @param fillPercentage the current fill percentage (0-100)
     * @return the appropriate status
     */
    public CylinderStatus calculateStatus(Double fillPercentage) {
        if (fillPercentage == null) {
            return CylinderStatus.UNKNOWN;
        }

        if (fillPercentage <= 0) {
            return CylinderStatus.EMPTY;
        }

        if (fillPercentage < thresholds.getCritical()) {
            return CylinderStatus.CRITICAL;
        }

        if (fillPercentage < thresholds.getLow()) {
            return CylinderStatus.LOW;
        }

        if (fillPercentage < thresholds.getNormal()) {
            return CylinderStatus.NORMAL;
        }

        return CylinderStatus.FULL;
    }

    /**
     * Updates a gas point's pressure reading and recalculates its status.
     * The "100%" reference is the point's effective full-tank pressure (derived from the
     * installed cylinders, falling back to the point's own field when there are none).
     *
     * @param pontoGas    the gas point to update
     * @param pressureBar the new pressure in bar
     */
    public void updatePressureAndStatus(PontoGas pontoGas, BigDecimal pressureBar) {
        if (pressureBar == null) {
            throw new IllegalArgumentException("Pressure cannot be null");
        }

        if (pressureBar.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Pressure cannot be negative");
        }

        pontoGas.setCurrentPressureBar(pressureBar);
        // UTC, não hora local: o job compara este campo com timestamps do DynamoDB convertidos
        // em UTC. Em JVM fora de UTC os dois discordariam pelo offset, a guarda de "só avança"
        // deixaria de valer e o mesmo dado velho seria reaplicado a cada ciclo — o que renovaria
        // lastReadingAt para sempre e faria sensor morto nunca aparecer como SEM_SINAL.
        pontoGas.setLastReadingAt(LocalDateTime.now(ZoneOffset.UTC));

        Double fillPercentage = calculateFillPercentage(pressureBar, pontoGas.getEffectiveFullTankPressureBar());
        pontoGas.setStatus(calculateStatus(fillPercentage));

        log.debug("Gas point {} updated: pressure={} bar, fill={}%, status={}",
            pontoGas.getId(), pressureBar, fillPercentage, pontoGas.getStatus());
    }

    /**
     * Calculates fill percentage based on current pressure and capacity.
     * Returns {@code null} when either input is missing (e.g. no prior reading).
     */
    public Double calculateFillPercentage(BigDecimal currentPressure, BigDecimal capacity) {
        if (currentPressure == null || capacity == null || capacity.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return currentPressure.divide(capacity, 4, java.math.RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();
    }

    /**
     * Returns the current threshold configuration for informational purposes.
     */
    public CylinderThresholdsConfiguration getThresholds() {
        return thresholds;
    }
}
