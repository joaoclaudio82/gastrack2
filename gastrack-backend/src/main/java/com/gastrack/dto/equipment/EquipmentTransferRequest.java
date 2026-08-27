package com.gastrack.dto.equipment;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;

public record EquipmentTransferRequest(
    @NotNull(message = "Target kit ID is required")
    @JsonAlias("toKitId")
    Long targetKitId,

    String notes
) {}
