package com.gastrack.dto.state;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StateRequest(
    @NotBlank(message = "State name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @NotBlank(message = "State code is required")
    @Size(min = 2, max = 2, message = "Code must be exactly 2 characters (IBGE code)")
    String code,

    @NotBlank(message = "State abbreviation is required")
    @Size(min = 2, max = 2, message = "Abbreviation must be exactly 2 characters")
    String abbreviation,

    @NotNull(message = "Country ID is required")
    Long countryId
) {}
