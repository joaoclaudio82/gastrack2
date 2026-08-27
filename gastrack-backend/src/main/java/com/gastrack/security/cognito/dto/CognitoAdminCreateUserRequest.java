package com.gastrack.security.cognito.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Cognito AdminCreateUser operation.
 * This creates a user with a temporary password that Cognito sends via email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoAdminCreateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String firstName;

    private String lastName;

    private String phoneNumber;

    /**
     * If true, Cognito will send the temporary password via email.
     * If false, the temporary password will be returned in the response.
     */
    @Builder.Default
    private boolean sendEmail = true;
}
