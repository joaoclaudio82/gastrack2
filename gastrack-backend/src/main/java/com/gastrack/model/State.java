package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "states", indexes = {
    @Index(name = "idx_states_country_id", columnList = "country_id"),
    @Index(name = "idx_states_active", columnList = "active"),
    @Index(name = "idx_states_abbreviation", columnList = "abbreviation")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class State {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "state_seq")
    @SequenceGenerator(name = "state_seq", sequenceName = "state_id_seq", allocationSize = 50)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 2)
    private String code;

    @Column(nullable = false, length = 2)
    private String abbreviation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "state", cascade = CascadeType.ALL)
    @Builder.Default
    private List<City> cities = new ArrayList<>();

    public void addCity(City city) {
        cities.add(city);
        city.setState(this);
    }

    public void removeCity(City city) {
        cities.remove(city);
        city.setState(null);
    }
}
