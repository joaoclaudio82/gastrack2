package com.gastrack.dto.country;

import java.time.LocalDateTime;

public record CountryResponse(
    Long id,
    String name,
    String code,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
