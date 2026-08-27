package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Contract entity representing an agreement with a company.
 * Multi-tenant via company_id.
 */
@Entity
@Table(name = "contracts", indexes = {
    @Index(name = "idx_contracts_company_id", columnList = "company_id"),
    @Index(name = "idx_contracts_status", columnList = "status"),
    @Index(name = "idx_contracts_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "contract_seq")
    @SequenceGenerator(name = "contract_seq", sequenceName = "contract_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "contract_number", nullable = false, unique = true, length = 50)
    private String contractNumber;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "kit_quantity", nullable = false)
    @Builder.Default
    private Integer kitQuantity = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContractStatus status = ContractStatus.DRAFT;

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

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    @Builder.Default
    private List<EquipmentKit> equipmentKits = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "contract_addresses",
        joinColumns = @JoinColumn(name = "contract_id"),
        inverseJoinColumns = @JoinColumn(name = "address_id")
    )
    @Builder.Default
    private Set<Address> allowedAddresses = new HashSet<>();

    public void addEquipmentKit(EquipmentKit kit) {
        equipmentKits.add(kit);
        kit.setContract(this);
    }

    public void removeEquipmentKit(EquipmentKit kit) {
        equipmentKits.remove(kit);
        kit.setContract(null);
    }

    /**
     * Check if this contract can accept more kits.
     */
    public boolean canAddMoreKits() {
        long activeKits = equipmentKits.stream()
            .filter(kit -> Boolean.TRUE.equals(kit.getActive()))
            .count();
        return activeKits < kitQuantity;
    }

    /**
     * Get remaining kit capacity.
     */
    public int getRemainingKitCapacity() {
        long activeKits = equipmentKits.stream()
            .filter(kit -> Boolean.TRUE.equals(kit.getActive()))
            .count();
        return Math.max(0, kitQuantity - (int) activeKits);
    }

    public void setAllowedAddresses(List<Address> addresses) {
        this.allowedAddresses.clear();
        if (addresses != null) {
            this.allowedAddresses.addAll(addresses);
        }
    }
}
