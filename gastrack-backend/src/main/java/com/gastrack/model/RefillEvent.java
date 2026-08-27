package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A refill of a gas point. Recorded automatically when the sensor sees a pressure jump
 * (source AUTO) or when the client registers the new bottle serial (source MANUAL).
 * The reading lives on the point, so the event is scoped to the point; the cylinder is
 * only known for MANUAL refills.
 */
@Entity
@Table(name = "refill_events", indexes = {
    @Index(name = "idx_refill_events_gas_point", columnList = "gas_point_id, detected_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefillEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "refill_event_seq")
    @SequenceGenerator(name = "refill_event_seq", sequenceName = "refill_event_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gas_point_id", nullable = false)
    private PontoGas gasPoint;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "from_fill", precision = 6, scale = 2)
    private BigDecimal fromFill;

    @Column(name = "to_fill", precision = 6, scale = 2)
    private BigDecimal toFill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RefillSource source;

    /** Set only for MANUAL refills — the new bottle registered by the client. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cylinder_id")
    private Cylinder cylinder;
}
