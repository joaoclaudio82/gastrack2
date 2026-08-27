package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Company entity representing a tenant in the multi-tenant system.
 * Each company has its own addresses, cylinders, and users.
 */
@Entity
@Table(name = "companies", indexes = {
    @Index(name = "idx_companies_active", columnList = "active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "company_seq")
    @SequenceGenerator(name = "company_seq", sequenceName = "company_id_seq", allocationSize = 50)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, unique = true, length = 18)
    private String cnpj;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    /**
     * Per-company override for the "sem sinal" (stale reading) limit, in minutes.
     * Null falls back to the global default applied in the monitoring service.
     */
    @Column(name = "stale_reading_threshold_minutes")
    private Integer staleReadingThresholdMinutes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private List<User> users = new ArrayList<>();

    public void addAddress(Address address) {
        addresses.add(address);
        address.setCompany(this);
    }

    public void removeAddress(Address address) {
        addresses.remove(address);
        address.setCompany(null);
    }

    public void addUser(User user) {
        users.add(user);
        user.setCompany(this);
    }

    public void removeUser(User user) {
        users.remove(user);
        user.setCompany(null);
    }
}
