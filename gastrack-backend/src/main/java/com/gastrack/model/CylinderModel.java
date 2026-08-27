package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;

/**
 * Catalog of cylinder types/models (industry standard: type catalog + serial per unit).
 * A {@link Cylinder} references a model; gas/volume/pressure are filled from here.
 */
/*
 * @BatchSize: cada Cylinder aponta LAZY para o seu modelo, e a listagem de linhas lê
 * codigo/gás/litros/bar de todos eles. Sem isto, uma página de 20 linhas com 3 cascos cada
 * dispara ~60 SELECTs extras — o @BatchSize da coleção de cilindros não alcança o modelo.
 */
@Entity
@BatchSize(size = 100)
@Table(name = "cylinder_models", indexes = {
    @Index(name = "idx_cylinder_models_gas_type", columnList = "gas_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CylinderModel extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cylinder_model_seq")
    @SequenceGenerator(name = "cylinder_model_seq", sequenceName = "cylinder_model_id_seq", allocationSize = 50)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(name = "gas_type", nullable = false, length = 20)
    private GasType gasType;

    @Column(name = "water_volume_liters", nullable = false, precision = 10, scale = 2)
    private BigDecimal waterVolumeLiters;

    @Column(name = "capacity_bar", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityBar;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
