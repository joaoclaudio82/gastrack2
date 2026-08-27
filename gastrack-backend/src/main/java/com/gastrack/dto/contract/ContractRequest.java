package com.gastrack.dto.contract;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record ContractRequest(
    @NotNull(message = "Company ID is required")
    Long companyId,

    @NotEmpty(message = "At least one address must be selected")
    List<Long> addressIds,

    @NotNull(message = "Start date is required")
    LocalDate startDate,

    LocalDate endDate,

    @NotNull(message = "Kit quantity is required")
    @Min(value = 1, message = "Kit quantity must be at least 1")
    Integer kitQuantity,

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    String notes,

    /** IDs of addresses linked to this contract (optional). */
    List<Long> allowedAddressIds
) {}
