package com.gastrack.dto.equipmenttype;

import java.time.LocalDateTime;

public record EquipmentTypeResponse(
    Long id,
    String name,
    String description,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
