package com.gastrack.dto.equipment;

import jakarta.validation.constraints.NotNull;

public record EquipmentAssignRequest(
    @NotNull(message = "Kit ID is required")
    Long kitId
) {}
