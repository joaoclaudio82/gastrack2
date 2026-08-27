package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Address entity representing a physical location of a company.
 * Each address can have multiple cylinders and gas points.
 */
@Entity
@Table(name = "addresses", indexes = {
    @Index(name = "idx_addresses_company_id", columnList = "company_id"),
    @Index(name = "idx_addresses_city_id", columnList = "city_id"),
    @Index(name = "idx_addresses_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "address_seq")
    @SequenceGenerator(name = "address_seq", sequenceName = "address_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 255)
    private String street;

    @Column(length = 20)
    private String number;

    @Column(length = 100)
    private String complement;

    @Column(length = 100)
    private String neighborhood;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(name = "zip_code", nullable = false, length = 10)
    private String zipCode;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "address", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Cylinder> cylinders = new ArrayList<>();

    @OneToMany(mappedBy = "address", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PontoGas> gasPoints = new ArrayList<>();

    public void addCylinder(Cylinder cylinder) {
        cylinders.add(cylinder);
        cylinder.setAddress(this);
    }

    public void removeCylinder(Cylinder cylinder) {
        cylinders.remove(cylinder);
        cylinder.setAddress(null);
    }

    public void addGasPoint(PontoGas gasPoint) {
        gasPoints.add(gasPoint);
        gasPoint.setAddress(this);
    }

    public void removeGasPoint(PontoGas gasPoint) {
        gasPoints.remove(gasPoint);
        gasPoint.setAddress(null);
    }

    /**
     * Get full address as a formatted string.
     */
    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        sb.append(street);
        if (number != null && !number.isBlank()) {
            sb.append(", ").append(number);
        }
        if (complement != null && !complement.isBlank()) {
            sb.append(" - ").append(complement);
        }
        if (neighborhood != null && !neighborhood.isBlank()) {
            sb.append(", ").append(neighborhood);
        }
        if (city != null) {
            sb.append(", ").append(city.getName());
            if (city.getState() != null) {
                sb.append("/").append(city.getState().getAbbreviation());
            }
        }
        sb.append(" - CEP: ").append(zipCode);
        return sb.toString();
    }
}
