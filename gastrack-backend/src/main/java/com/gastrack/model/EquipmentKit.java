package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Equipment Kit entity representing an installed kit at a location.
 * Multi-tenant via Contract -> Company.
 *
 * Design Note - address_id field:
 * This entity has address_id which represents the CURRENT location of the kit.
 * KitInstallation also has address_id but for a different purpose (operation history).
 * This is intentional denormalization ("Current State + History" pattern):
 * - EquipmentKit.address = current state (fast query: "where is it now?")
 * - KitInstallation.address = audit trail (INSTALLED, UNINSTALLED, RELOCATED)
 * Consistency is maintained by EquipmentKitServiceImpl.
 */
@Entity
@Table(name = "equipment_kits", indexes = {
    @Index(name = "idx_equipment_kits_contract_id", columnList = "contract_id"),
    @Index(name = "idx_equipment_kits_address_id", columnList = "address_id"),
    @Index(name = "idx_equipment_kits_status", columnList = "status"),
    @Index(name = "idx_equipment_kits_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentKit {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "equipment_kit_seq")
    @SequenceGenerator(name = "equipment_kit_seq", sequenceName = "equipment_kit_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @Column(name = "kit_code", nullable = false, unique = true, length = 50)
    private String kitCode;

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private KitStatus status = KitStatus.PENDING;

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

    @OneToMany(mappedBy = "equipmentKit", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Equipment> equipments = new ArrayList<>();

    /**
     * Get the company through the contract.
     */
    public Company getCompany() {
        return contract != null ? contract.getCompany() : null;
    }

    public void addEquipment(Equipment equipment) {
        equipments.add(equipment);
        equipment.setEquipmentKit(this);
    }

    public void removeEquipment(Equipment equipment) {
        equipments.remove(equipment);
        equipment.setEquipmentKit(null);
    }
}
