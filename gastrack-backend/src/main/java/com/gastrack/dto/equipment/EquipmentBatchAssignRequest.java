package com.gastrack.dto.equipment;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EquipmentBatchAssignRequest(
    @NotNull(message = "Equipment IDs are required")
    @NotEmpty(message = "At least one equipment ID is required")
    List<Long> equipmentIds,

    @NotNull(message = "Kit ID is required")
    Long kitId
) {}
