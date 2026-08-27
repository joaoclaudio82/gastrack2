package com.gastrack.dto.equipmentkit;

import com.gastrack.model.KitStatus;
import jakarta.validation.constraints.NotNull;

public record EquipmentKitStatusUpdateRequest(
    @NotNull(message = "Status is required")
    KitStatus status
) {}
