package com.gastrack.dto.city;

import java.time.LocalDateTime;

public record CityResponse(
    Long id,
    String name,
    String code,
    Long stateId,
    String stateName,
    String stateAbbreviation,
    Long countryId,
    String countryName,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
