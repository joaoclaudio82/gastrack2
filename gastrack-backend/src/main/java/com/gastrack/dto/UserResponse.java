package com.gastrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * User response DTO.
 * Contains full user information for detailed views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String cognitoSub;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phoneNumber;
    private Boolean phoneVerified;
    private String profilePictureUrl;
    private LocalDate birthDate;
    private String locale;
    private String timezone;
    private Boolean active;
    private String role;
    /** Empresa do usuário: o front lê daqui, não do token — nenhum fluxo grava esse dado no Cognito. */
    private Long companyId;
    private String companyName;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
