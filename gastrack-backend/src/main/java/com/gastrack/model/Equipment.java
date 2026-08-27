package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Equipment entity representing individual equipment items.
 * Global inventory - only SUPER_ADMIN can create.
 * Multi-tenant visibility: ADMIN/USER see equipment in their company's kits.
 */
@Entity
@Table(name = "equipment", indexes = {
    @Index(name = "idx_equipment_kit_id", columnList = "equipment_kit_id"),
    @Index(name = "idx_equipment_type_id", columnList = "equipment_type_id"),
    @Index(name = "idx_equipment_condition", columnList = "condition"),
    @Index(name = "idx_equipment_active", columnList = "active"),
    @Index(name = "idx_equipment_gas_point_id", columnList = "gas_point_id"),
    @Index(name = "idx_equipment_parent_id", columnList = "parent_equipment_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "equipment_seq")
    @SequenceGenerator(name = "equipment_seq", sequenceName = "equipment_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_kit_id")
    private EquipmentKit equipmentKit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gas_point_id")
    private PontoGas pontoGas;

    /** Parent ESP32 when this equipment is of type Sensor (one port of the ESP32). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_equipment_id")
    private Equipment parentEquipment;

    /** Port number (1-8) on the parent ESP32 when this equipment is of type Sensor. */
    @Column(name = "sensor_port")
    private Integer sensorPort;

    /** Unique code for DynamoDB filter: device_id|sensor_id (e.g. "4036EB1815AC|8"). Required when type is Sensor. */
    @Column(name = "codigo_sensor", length = 100)
    private String codigoSensor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_type_id", nullable = false)
    private EquipmentType equipmentType;

    @Column(name = "asset_tag", nullable = false, unique = true, length = 50)
    private String assetTag;

    @Column(length = 255)
    private String description;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(length = 100)
    private String manufacturer;

    @Column(length = 100)
    private String model;

    @Column(name = "purchase_url", length = 500)
    private String purchaseUrl;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_expiration_date")
    private LocalDate warrantyExpirationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 20)
    @Builder.Default
    private EquipmentCondition condition = EquipmentCondition.NEW;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Check if equipment is assigned to a kit.
     */
    public boolean isAssigned() {
        return equipmentKit != null;
    }

    /**
     * Get the company through the kit's contract.
     */
    public Company getCompany() {
        return equipmentKit != null ? equipmentKit.getCompany() : null;
    }
}
