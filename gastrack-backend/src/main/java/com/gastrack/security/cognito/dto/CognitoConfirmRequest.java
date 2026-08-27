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
public class CognitoConfirmRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Confirmation code is required")
    private String confirmationCode;
}
