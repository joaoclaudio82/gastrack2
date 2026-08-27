package com.gastrack.dto.country;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CountryRequest(
    @NotBlank(message = "Country name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @NotBlank(message = "Country code is required")
    @Size(min = 2, max = 2, message = "Code must be exactly 2 characters (ISO 3166-1 alpha-2)")
    String code
) {}
