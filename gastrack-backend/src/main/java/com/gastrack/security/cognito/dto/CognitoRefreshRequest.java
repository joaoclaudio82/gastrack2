package com.gastrack.security.cognito.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoRefreshRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    // Optional - if not provided, will be extracted from idToken
    private String username;

    // ID Token (JWT) - used to extract username if not provided
    private String idToken;
}
