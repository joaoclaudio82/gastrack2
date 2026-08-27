package com.gastrack.security.cognito.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Cognito AdminCreateUser operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoAdminCreateUserResponse {

    /**
     * The Cognito user sub (unique identifier).
     */
    private String userSub;

    /**
     * The username assigned in Cognito (usually the email).
     */
    private String username;

    /**
     * The user's status in Cognito.
     */
    private String userStatus;

    /**
     * Whether the invitation email was sent.
     */
    private boolean emailSent;

    /**
     * Message describing the result.
     */
    private String message;
}
