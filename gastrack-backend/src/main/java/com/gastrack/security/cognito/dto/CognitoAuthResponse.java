package com.gastrack.security.cognito.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoAuthResponse {

    private String accessToken;
    private String idToken;
    private String refreshToken;
    private Integer expiresIn;
    private String tokenType;

    // Challenge fields - populated when password change is required
    private String challengeName;
    private String session;

    // User profile from local database (populated after successful login)
    private String firstName;
    private String lastName;

    /**
     * Returns true if a challenge response is required (e.g., NEW_PASSWORD_REQUIRED)
     */
    public boolean requiresChallenge() {
        return challengeName != null && !challengeName.isBlank();
    }
}
