package com.gastrack.security.cognito.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for user registration in AWS Cognito.
 *
 * Maps to Cognito standard attributes:
 * - username -> Cognito username (login identifier)
 * - email -> Cognito 'email' attribute
 * - password -> Cognito password
 * - firstName -> Cognito 'given_name' attribute
 * - lastName -> Cognito 'family_name' attribute
 * - phoneNumber -> Cognito 'phone_number' attribute (E.164 format)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoSignUpRequest {

    /**
     * Username for login (can be email or custom username).
     */
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    /**
     * User's email address.
     * Will be verified by Cognito via confirmation code.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * User's password.
     * Must meet Cognito password policy requirements.
     * Requires: uppercase, lowercase, digit, special character, minimum 8 characters
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)"
    )
    private String password;

    /**
     * User's first name (given name).
     * Maps to Cognito 'given_name' attribute.
     */
    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must be at most 100 characters")
    private String firstName;

    /**
     * User's last name (family name).
     * Maps to Cognito 'family_name' attribute.
     */
    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must be at most 100 characters")
    private String lastName;

    /**
     * User's phone number in E.164 format (e.g., +5511999999999).
     * Optional - maps to Cognito 'phone_number' attribute.
     */
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone number must be in E.164 format (e.g., +5511999999999)")
    private String phoneNumber;

    /**
     * Helper method to get full name.
     */
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
