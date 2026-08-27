package com.gastrack.dto.kitinstallation;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record KitUninstallRequest(
    @PastOrPresent(message = "Uninstallation date cannot be in the future")
    LocalDate uninstallationDate,

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    String reason,

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    String notes
) {}
