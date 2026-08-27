package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_ping_logs", indexes = {
        @Index(name = "idx_device_ping_serial", columnList = "serial_number"),
        @Index(name = "idx_device_ping_pinged_at", columnList = "pinged_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevicePingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "device_ping_log_seq")
    @SequenceGenerator(name = "device_ping_log_seq", sequenceName = "device_ping_log_id_seq", allocationSize = 50)
    private Long id;

    @Column(name = "serial_number", nullable = false, length = 100)
    private String serialNumber;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @CreationTimestamp
    @Column(name = "pinged_at", nullable = false, updatable = false)
    private LocalDateTime pingedAt;
}
