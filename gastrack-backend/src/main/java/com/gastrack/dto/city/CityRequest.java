package com.gastrack.dto.city;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CityRequest(
    @NotBlank(message = "City name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @NotBlank(message = "City code is required")
    @Size(min = 7, max = 7, message = "Code must be exactly 7 characters (IBGE code)")
    String code,

    @NotNull(message = "State ID is required")
    Long stateId
) {}
