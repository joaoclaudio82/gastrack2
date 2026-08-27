package com.gastrack.dto.contract;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ContractAddressesUpdateRequest(
    @NotEmpty(message = "At least one address must be provided")
    List<Long> addressIds
) {}
