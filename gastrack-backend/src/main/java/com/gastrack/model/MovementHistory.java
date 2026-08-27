package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Movement History entity for audit trail.
 * Does NOT extend BaseAuditEntity as records are immutable.
 */
@Entity
@Table(name = "movement_history", indexes = {
    @Index(name = "idx_movement_history_equipment_id", columnList = "equipment_id"),
    @Index(name = "idx_movement_history_kit_id", columnList = "equipment_kit_id"),
    @Index(name = "idx_movement_history_operation_at", columnList = "operation_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovementHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "movement_history_seq")
    @SequenceGenerator(name = "movement_history_seq", sequenceName = "movement_history_id_seq", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_kit_id")
    private EquipmentKit equipmentKit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MovementOperation operation;

    @Column(name = "operation_at", nullable = false)
    @Builder.Default
    private LocalDateTime operationAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_kit_id")
    private EquipmentKit fromKit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_kit_id")
    private EquipmentKit toKit;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
