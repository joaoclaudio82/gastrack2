package com.gastrack.mapper;

import com.gastrack.configuration.CylinderThresholdsConfiguration;
import com.gastrack.dto.pontogas.PontoGasEquipmentResponse;
import com.gastrack.dto.pontogas.PontoGasRequest;
import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.model.Equipment;
import com.gastrack.model.PontoGas;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Classe abstrata (e não interface) para injetar os thresholds do servidor na resposta:
 * o cliente precisa das faixas de nível junto da linha em vez de redeclará-las.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public abstract class PontoGasMapper {

    @Autowired
    protected CylinderThresholdsConfiguration thresholds;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "equipments", ignore = true)
    @Mapping(target = "cylinders", ignore = true)
    public abstract PontoGas toEntity(PontoGasRequest request);

    @Mapping(source = "address.id", target = "addressId")
    @Mapping(source = "address.name", target = "addressName")
    @Mapping(source = "equipments", target = "equipments")
    @Mapping(target = "effectiveCapacityLiters", expression = "java(pontoGas.getEffectiveCapacityLiters())")
    @Mapping(target = "effectiveFullTankPressureBar", expression = "java(pontoGas.getEffectiveFullTankPressureBar())")
    @Mapping(target = "thresholds", expression = "java(currentThresholds())")
    @Mapping(target = "availableCubicMeters", expression = "java(pontoGas.getAvailableCubicMeters())")
    @Mapping(target = "fillPercentage", expression = "java(fillOf(pontoGas))")
    @Mapping(target = "gasType", expression = "java(pontoGas.getGasType())")
    @Mapping(target = "cylinders", expression = "java(cylinderViews(pontoGas))")
    public abstract PontoGasResponse toResponse(PontoGas pontoGas);

    /** Nível em % da linha. Mesma conta do CylinderStatusCalculator, sobre a pressão efetiva. */
    protected Double fillOf(PontoGas pontoGas) {
        java.math.BigDecimal pressure = pontoGas.getCurrentPressureBar();
        java.math.BigDecimal full = pontoGas.getEffectiveFullTankPressureBar();
        if (pressure == null || full == null || full.signum() == 0) {
            return null;
        }
        return pressure.divide(full, 4, java.math.RoundingMode.HALF_UP)
            .multiply(java.math.BigDecimal.valueOf(100))
            .doubleValue();
    }

    /**
     * Cascos ativos da linha, conectados ou não — a UI mostra a reserva fechada em cinza,
     * então ela precisa vir na lista mesmo ficando fora da soma.
     */
    protected java.util.List<PontoGasResponse.CylinderView> cylinderViews(PontoGas pontoGas) {
        if (pontoGas.getCylinders() == null) {
            return java.util.List.of();
        }
        return pontoGas.getCylinders().stream()
            .filter(c -> Boolean.TRUE.equals(c.getActive()))
            .map(c -> new PontoGasResponse.CylinderView(
                c.getId(),
                c.getSerialNumber(),
                c.getCylinderModel() != null ? c.getCylinderModel().getCodigo() : null,
                c.getCylinderModel() != null ? c.getCylinderModel().getGasType() : null,
                c.getCylinderModel() != null ? c.getCylinderModel().getWaterVolumeLiters() : null,
                c.getCylinderModel() != null ? c.getCylinderModel().getCapacityBar() : null,
                c.getConnected()))
            .toList();
    }

    protected PontoGasResponse.ThresholdsView currentThresholds() {
        return new PontoGasResponse.ThresholdsView(
            thresholds.getCritical(), thresholds.getLow(), thresholds.getNormal());
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "equipments", ignore = true)
    @Mapping(target = "cylinders", ignore = true)
    public abstract void updateEntity(PontoGasRequest request, @MappingTarget PontoGas pontoGas);

    @Mapping(source = "equipmentType.name", target = "equipmentTypeName")
    @Mapping(source = "codigoSensor", target = "codigoSensor")
    @Mapping(source = "sensorPort", target = "sensorPort")
    @Mapping(target = "parentSerial", expression = "java(equipment.getParentEquipment() != null ? equipment.getParentEquipment().getSerialNumber() : null)")
    public abstract PontoGasEquipmentResponse toEquipmentResponse(Equipment equipment);
}
