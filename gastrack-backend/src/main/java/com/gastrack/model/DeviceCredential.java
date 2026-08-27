package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Device credential entity storing IoT Core provisioning data for ESP32 equipment.
 * Each ESP32 Equipment has at most one active credential (1:1 relationship).
 */
@Entity
@Table(name = "device_credentials")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "device_credential_seq")
    @SequenceGenerator(name = "device_credential_seq", sequenceName = "device_credential_id_seq", allocationSize = 50)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false, unique = true)
    private Equipment equipment;

    @Column(name = "thing_name", nullable = false, unique = true, length = 128)
    private String thingName;

    @Column(name = "certificate_id", nullable = false, length = 128)
    private String certificateId;

    @Column(name = "certificate_pem", nullable = false, columnDefinition = "TEXT")
    private String certificatePem;

    @Column(name = "private_key", nullable = false, columnDefinition = "TEXT")
    private String privateKey;

    @Column(name = "public_key", nullable = false, columnDefinition = "TEXT")
    private String publicKey;

    @Column(name = "iot_endpoint", nullable = false, length = 255)
    private String iotEndpoint;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
