package com.gastrack.dto.contract;

import com.gastrack.model.ContractStatus;
import jakarta.validation.constraints.NotNull;

public record ContractStatusUpdateRequest(
    @NotNull(message = "Status is required")
    ContractStatus status
) {}
