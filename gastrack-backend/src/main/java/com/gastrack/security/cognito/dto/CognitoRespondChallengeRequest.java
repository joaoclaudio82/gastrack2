package com.gastrack.security.cognito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for responding to Cognito authentication challenges.
 * Used primarily for NEW_PASSWORD_REQUIRED challenge when user must set a new password.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoRespondChallengeRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String newPassword;

    @NotBlank(message = "Session is required")
    private String session;

    @NotBlank(message = "Challenge name is required")
    private String challengeName;
}
