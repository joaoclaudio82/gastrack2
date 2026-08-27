package com.gastrack.dto.address;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AddressResponse(
    Long id,
    Long companyId,
    String companyName,
    String name,
    String street,
    String number,
    String complement,
    String neighborhood,
    Long cityId,
    String cityName,
    String cityCode,
    Long stateId,
    String stateName,
    String stateAbbreviation,
    Long countryId,
    String countryName,
    String zipCode,
    BigDecimal latitude,
    BigDecimal longitude,
    String fullAddress,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
