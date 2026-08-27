package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Versioned, append-only price per m³ of gas, scoped by (company × gasType).
 * The current price is the row with the greatest {@code validFrom <= now} that is active.
 * A new price is a new row; old rows are never edited (see spec §5.2).
 */
@Entity
@Table(name = "gas_prices", indexes = {
    @Index(name = "idx_gas_prices_lookup", columnList = "company_id, gas_type, valid_from")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GasPrice extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gas_price_seq")
    @SequenceGenerator(name = "gas_price_seq", sequenceName = "gas_price_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "gas_type", nullable = false, length = 20)
    private GasType gasType;

    @Column(name = "price_per_m3", nullable = false, precision = 12, scale = 4)
    private BigDecimal pricePerM3;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "BRL";

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
