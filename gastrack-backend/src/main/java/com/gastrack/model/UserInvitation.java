package com.gastrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing a user invitation.
 *
 * When an admin invites a user, this record is created along with
 * a Cognito user via AdminCreateUser. The invitation tracks the
 * status and links the invited user to their intended company and role.
 */
@Entity
@Table(name = "user_invitations", indexes = {
    @Index(name = "idx_user_invitations_email", columnList = "email"),
    @Index(name = "idx_user_invitations_status", columnList = "status"),
    @Index(name = "idx_user_invitations_company_id", columnList = "company_id"),
    @Index(name = "idx_user_invitations_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_invitation_seq")
    @SequenceGenerator(name = "user_invitation_seq", sequenceName = "user_invitation_id_seq", allocationSize = 50)
    private Long id;

    /**
     * Email address of the invited user.
     */
    @Column(nullable = false, length = 255)
    private String email;

    /**
     * Role to be assigned to the user upon acceptance.
     * ADMIN can only invite USER or ADMIN within their company.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    /**
     * Company the user will be assigned to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /**
     * Unique token for tracking the invitation.
     */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /**
     * Current status of the invitation.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InvitationStatus status = InvitationStatus.PENDING;

    /**
     * Username assigned in Cognito (usually the email).
     */
    @Column(name = "cognito_username", length = 255)
    private String cognitoUsername;

    /**
     * When the invitation expires.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * The user who created this invitation.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Check if the invitation has expired.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if the invitation is still valid (pending and not expired).
     */
    public boolean isValid() {
        return status == InvitationStatus.PENDING && !isExpired();
    }

    /**
     * Mark the invitation as accepted.
     */
    public void accept() {
        this.status = InvitationStatus.ACCEPTED;
    }

    /**
     * Mark the invitation as cancelled.
     */
    public void cancel() {
        this.status = InvitationStatus.CANCELLED;
    }

    /**
     * Mark the invitation as expired.
     */
    public void expire() {
        this.status = InvitationStatus.EXPIRED;
    }
}
