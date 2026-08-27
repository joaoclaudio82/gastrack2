package com.gastrack.dto.kitinstallation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record KitInstallRequest(
    @NotNull(message = "Address is required for installation")
    Long addressId,

    @PastOrPresent(message = "Installation date cannot be in the future")
    LocalDate installationDate,

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    String notes
) {}
