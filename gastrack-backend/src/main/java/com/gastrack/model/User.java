package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Local User entity that references AWS Cognito user.
 *
 * This entity stores application-specific user data.
 * Authentication data (password, tokens) is managed by Cognito.
 *
 * The cognitoSub field is the unique identifier from Cognito
 * and serves as the link between local and Cognito user data.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_cognito_sub", columnList = "cognito_sub", unique = true),
    @Index(name = "idx_users_email", columnList = "email", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "user_id_seq", allocationSize = 50)
    private Long id;

    /**
     * Unique identifier from AWS Cognito (UUID format).
     * This is the 'sub' claim from Cognito JWT tokens.
     * Used to link local user data with Cognito user.
     */
    @Column(name = "cognito_sub", nullable = false, unique = true, length = 36)
    private String cognitoSub;

    /**
     * User's email address.
     * Must match the email in Cognito for consistency.
     */
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /**
     * User's preferred username.
     * Can be different from Cognito username.
     */
    @Column(length = 50)
    private String username;

    /**
     * User's first name.
     * Synced from Cognito 'given_name' attribute.
     */
    @Column(name = "first_name", length = 100)
    private String firstName;

    /**
     * User's last name.
     * Synced from Cognito 'family_name' attribute.
     */
    @Column(name = "last_name", length = 100)
    private String lastName;

    /**
     * User's phone number in E.164 format (+1234567890).
     * Synced from Cognito 'phone_number' attribute.
     */
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    /**
     * Whether the phone number has been verified in Cognito.
     */
    @Column(name = "phone_verified")
    private Boolean phoneVerified;

    /**
     * URL to user's profile picture.
     * Can be stored in S3 or external service.
     */
    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    /**
     * User's date of birth.
     */
    @Column(name = "birth_date")
    private LocalDate birthDate;

    /**
     * User's locale/language preference (e.g., 'en-US', 'pt-BR').
     */
    @Column(length = 10)
    private String locale;

    /**
     * User's timezone (e.g., 'America/Sao_Paulo').
     */
    @Column(length = 50)
    private String timezone;

    /**
     * Whether the user account is active.
     * Used for soft-disable without deleting from Cognito.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * User's role in the application.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    /**
     * The company this user belongs to.
     * Can be null for SUPER_ADMIN users.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /**
     * Timestamp when the user was created locally.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp of the last update.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Timestamp of last login.
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /**
     * Validates that non-SUPER_ADMIN users must have a company assigned.
     * This is enforced both at the database level (CHECK constraint) and here.
     */
    @PrePersist
    @PreUpdate
    private void validateCompanyRequirement() {
        if (role != UserRole.SUPER_ADMIN && company == null) {
            throw new IllegalStateException("Users with role " + role + " must have a company assigned");
        }
    }

    /**
     * Get user's full name.
     */
    public String getFullName() {
        if (firstName == null && lastName == null) {
            return username;
        }
        StringBuilder name = new StringBuilder();
        if (firstName != null) {
            name.append(firstName);
        }
        if (lastName != null) {
            if (name.length() > 0) {
                name.append(" ");
            }
            name.append(lastName);
        }
        return name.toString();
    }
}
