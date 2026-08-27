package com.gastrack.dto.invitation;

import com.gastrack.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a user invitation.
 *
 * @param email The email address of the user to invite
 * @param role The role to assign to the user (USER or ADMIN)
 * @param companyId The company to assign the user to (required for SUPER_ADMIN, ignored for ADMIN)
 * @param firstName Optional first name for the invited user
 * @param lastName Optional last name for the invited user
 */
public record CreateInvitationRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotNull(message = "Role is required")
    UserRole role,

    Long companyId,

    String firstName,

    String lastName
) {
}
