package com.gastrack.dto.invitation;

import com.gastrack.model.InvitationStatus;
import com.gastrack.model.UserRole;

import java.time.LocalDateTime;

/**
 * Response DTO for user invitation.
 *
 * @param id The invitation ID
 * @param email The email address of the invited user
 * @param role The role to be assigned
 * @param companyId The company ID the user will be assigned to
 * @param companyName The name of the company
 * @param status The current status of the invitation
 * @param expiresAt When the invitation expires
 * @param createdAt When the invitation was created
 * @param createdByEmail Email of the user who created the invitation
 */
public record InvitationResponse(
    Long id,
    String email,
    UserRole role,
    Long companyId,
    String companyName,
    InvitationStatus status,
    LocalDateTime expiresAt,
    LocalDateTime createdAt,
    String createdByEmail
) {
}
