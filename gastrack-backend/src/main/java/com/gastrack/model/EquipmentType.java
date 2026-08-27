package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Equipment Type entity representing a category of equipment.
 * This is global reference data, not tenant-specific.
 */
@Entity
@Table(name = "equipment_types", indexes = {
    @Index(name = "idx_equipment_types_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentType {

    /**
     * Canonical name of the ESP32 equipment type. Centralized here so the multiple services
     * that branch on equipment-type identity ({@code equipmentType.getName()}) share a single
     * source of truth instead of duplicating the literal {@code "ESP32"}.
     */
    public static final String ESP32_TYPE_NAME = "ESP32";

    /** Canonical name of the Sensor equipment type (one port of an ESP32). */
    public static final String SENSOR_TYPE_NAME = "Sensor";

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "equipment_type_seq")
    @SequenceGenerator(name = "equipment_type_seq", sequenceName = "equipment_type_id_seq", allocationSize = 50)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
