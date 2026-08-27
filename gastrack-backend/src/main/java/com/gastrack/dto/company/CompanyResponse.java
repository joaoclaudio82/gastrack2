package com.gastrack.dto.company;

import java.time.LocalDateTime;

public record CompanyResponse(
    Long id,
    String name,
    String slug,
    String cnpj,
    String phone,
    String email,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
