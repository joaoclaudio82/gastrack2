package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing a kit installation operation.
 * Records the history of installations, uninstallations, and relocations.
 *
 * Design Note - address_id field:
 * This entity has address_id which represents the address of a SPECIFIC OPERATION.
 * EquipmentKit also has address_id but for a different purpose (current location).
 * This is intentional denormalization ("Current State + History" pattern):
 * - EquipmentKit.address = current state (fast query: "where is it now?")
 * - KitInstallation.address = audit trail (this entity)
 * Consistency is maintained by EquipmentKitServiceImpl.
 */
@Entity
@Table(name = "kit_installations", indexes = {
    @Index(name = "idx_kit_installations_kit_id", columnList = "kit_id"),
    @Index(name = "idx_kit_installations_address_id", columnList = "address_id"),
    @Index(name = "idx_kit_installations_operation_date", columnList = "operation_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KitInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "kit_installation_seq")
    @SequenceGenerator(name = "kit_installation_seq", sequenceName = "kit_installation_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kit_id", nullable = false)
    private EquipmentKit kit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false, length = 30)
    private KitOperationType operationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "operation_date", nullable = false)
    private LocalDate operationDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Get the company through the kit.
     */
    public Company getCompany() {
        return kit != null ? kit.getCompany() : null;
    }
}
