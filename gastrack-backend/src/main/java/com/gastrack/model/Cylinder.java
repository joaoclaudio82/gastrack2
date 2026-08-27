package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Cylinder entity representing a physical gas cylinder unit.
 * Gas/volume/capacity come from its {@link CylinderModel}; the pressure reading
 * now lives on the {@link PontoGas} where the cylinder is installed.
 */
@Entity
@Table(name = "cylinders", indexes = {
    @Index(name = "idx_cylinders_address_id", columnList = "address_id"),
    @Index(name = "idx_cylinders_cylinder_model_id", columnList = "cylinder_model_id"),
    @Index(name = "idx_cylinders_gas_point_id", columnList = "gas_point_id"),
    @Index(name = "idx_cylinders_company_id", columnList = "company_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cylinder {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cylinder_seq")
    @SequenceGenerator(name = "cylinder_seq", sequenceName = "cylinder_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cylinder_model_id", nullable = false)
    private CylinderModel cylinderModel;

    /**
     * Dono do cilindro. Único caminho de tenant desde a V45 — não derive de ponto/endereço.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gas_point_id")
    private PontoGas pontoGas;

    /**
     * Endereço do cilindro. Quando há {@link #pontoGas}, espelha o endereço do ponto
     * (garantido por {@link #setPontoGas}); serve para localizar cilindro em estoque.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * Válvula aberta no manifold. Um casco de reserva fechado não está na pressão que o
     * sensor mede, então fica fora do volume da linha. Distinto de {@link #active}, que
     * significa "não foi aposentado do inventário".
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean connected = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Instalar num ponto define o endereço junto — as duas localizações não podem divergir.
     * Desinstalar (null) preserva o endereço: o casco continua fisicamente onde estava.
     */
    public void setPontoGas(PontoGas pontoGas) {
        this.pontoGas = pontoGas;
        if (pontoGas != null && pontoGas.getAddress() != null) {
            this.address = pontoGas.getAddress();
        }
    }
}
