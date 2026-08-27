package com.gastrack.dto.state;

import java.time.LocalDateTime;

public record StateResponse(
    Long id,
    String name,
    String code,
    String abbreviation,
    Long countryId,
    String countryName,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
