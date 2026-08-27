package com.gastrack.model;

import com.gastrack.exceptions.BusinessException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * PontoGas entity representing a gas point location.
 * Each gas point belongs to an address and can have multiple equipments.
 */
@Entity
@Table(name = "gas_points", indexes = {
    @Index(name = "idx_gas_points_address_id", columnList = "address_id"),
    @Index(name = "idx_gas_points_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PontoGas {

    private static final String SENSOR_TYPE_NAME = "Sensor";

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gas_point_seq")
    @SequenceGenerator(name = "gas_point_seq", sequenceName = "gas_point_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(name = "current_pressure_bar", precision = 10, scale = 2)
    private BigDecimal currentPressureBar;

    @Column(name = "last_reading_at")
    private LocalDateTime lastReadingAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CylinderStatus status = CylinderStatus.UNKNOWN;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /*
     * @BatchSize nas duas coleções: a listagem de linhas é paginada, e JOIN FETCH de coleção
     * com Pageable faz o Hibernate paginar em memória (HHH000104) — carregaria a tabela toda.
     * Batch fetching resolve sem esse efeito: uma página de 20 linhas vira 1 SELECT ... IN (...)
     * por coleção em vez de 20.
     */
    @OneToMany(mappedBy = "pontoGas", cascade = {CascadeType.PERSIST, CascadeType.MERGE}, orphanRemoval = false)
    @BatchSize(size = 50)
    @Builder.Default
    private List<Equipment> equipments = new ArrayList<>();

    @OneToMany(mappedBy = "pontoGas", fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    @Builder.Default
    private List<Cylinder> cylinders = new ArrayList<>();

    /**
     * Cascos que realmente compõem o manifold: ativos no inventário, com modelo, e com a
     * válvula aberta. Reserva fechada fica de fora — não está na pressão que o sensor mede.
     */
    private List<Cylinder> suppliedCylinders() {
        if (cylinders == null) {
            return List.of();
        }
        return cylinders.stream()
            .filter(c -> Boolean.TRUE.equals(c.getActive())
                && Boolean.TRUE.equals(c.getConnected())
                && c.getCylinderModel() != null)
            .toList();
    }

    /**
     * Volume real da linha: soma do volume de água dos cilindros ativos do banco/manifold.
     * Um sensor mede a saída combinada, então a autonomia tem que considerar todos os cascos —
     * não um número digitado à mão. {@code null} quando a linha não tem casco conectado.
     */
    public BigDecimal getEffectiveCapacityLiters() {
        List<Cylinder> installed = suppliedCylinders();
        if (installed.isEmpty()) {
            // Sem casco não há gás: a linha é só tubulação. Antes daqui saía um
            // fallback gravado de 5 L, que era ficção — a linha não comporta nada.
            return null;
        }
        return installed.stream()
            .map(c -> c.getCylinderModel().getWaterVolumeLiters())
            .filter(java.util.Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Pressão de "100%" da linha. Com modelos de pressões diferentes no mesmo manifold,
     * o teto é o menor deles — não dá para encher acima do casco mais fraco.
     */
    public BigDecimal getEffectiveFullTankPressureBar() {
        return suppliedCylinders().stream()
            .map(c -> c.getCylinderModel().getCapacityBar())
            .filter(java.util.Objects::nonNull)
            .min(BigDecimal::compareTo)
            .orElse(null);
    }

    /**
     * Gás disponível em m³ pela lei de Boyle: litros × bar ÷ 1000.
     * Sem fator de compressibilidade nem correção de temperatura — vale para gases
     * comprimidos, que é o escopo declarado (GLP liquefeito está fora).
     */
    public BigDecimal getAvailableCubicMeters() {
        BigDecimal capacity = getEffectiveCapacityLiters();
        if (currentPressureBar == null || capacity == null) {
            return null;
        }
        return capacity
            .multiply(currentPressureBar)
            .divide(BigDecimal.valueOf(1000), 4, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Tipo de gás da linha, derivado dos cilindros instalados (todos iguais por invariante
     * validada no cadastro). {@code null} quando a linha ainda não tem cilindro.
     */
    public GasType getGasType() {
        return suppliedCylinders().stream()
            .map(c -> c.getCylinderModel().getGasType())
            .filter(java.util.Objects::nonNull)
            .findFirst()
            .orElse(null);
    }

    public void addEquipment(Equipment equipment) {
        if (equipment.getEquipmentType() == null || equipment.getEquipmentType().getName() == null) {
            throw new BusinessException("Equipment type is required to associate equipment to gas point");
        }

        if (!SENSOR_TYPE_NAME.equalsIgnoreCase(equipment.getEquipmentType().getName())) {
            throw new BusinessException("Only Sensor equipments (porta do ESP32) can be associated to a gas point");
        }

        equipments.add(equipment);
        equipment.setPontoGas(this);
    }

    public void removeEquipment(Equipment equipment) {
        equipments.remove(equipment);
        equipment.setPontoGas(null);
    }
}
