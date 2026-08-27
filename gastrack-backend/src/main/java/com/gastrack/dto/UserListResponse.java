package com.gastrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight user response DTO for list views.
 * Contains only essential user information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {

    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String companyName;
    private Boolean active;
}
