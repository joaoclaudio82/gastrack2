package com.gastrack.security.cognito.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitoConfirmResponse {

    private Boolean confirmed;
    private String message;
}
