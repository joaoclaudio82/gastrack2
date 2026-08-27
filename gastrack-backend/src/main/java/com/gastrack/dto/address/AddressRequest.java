package com.gastrack.dto.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record AddressRequest(
    // Optional - if not provided, extracted from JWT token
    Long companyId,

    @NotBlank(message = "Address name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    String name,

    @NotBlank(message = "Street is required")
    @Size(max = 255, message = "Street must not exceed 255 characters")
    String street,

    @Size(max = 20, message = "Number must not exceed 20 characters")
    String number,

    @Size(max = 100, message = "Complement must not exceed 100 characters")
    String complement,

    @Size(max = 100, message = "Neighborhood must not exceed 100 characters")
    String neighborhood,

    @NotNull(message = "City ID is required")
    Long cityId,

    @NotBlank(message = "ZIP code is required")
    @Size(max = 10, message = "ZIP code must not exceed 10 characters")
    String zipCode,

    BigDecimal latitude,

    BigDecimal longitude,

    /** Optional: link this address to one or more contracts (contract_addresses). */
    List<Long> contractIds
) {}
