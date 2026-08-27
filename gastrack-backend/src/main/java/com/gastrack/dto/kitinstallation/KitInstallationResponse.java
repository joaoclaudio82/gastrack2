package com.gastrack.dto.kitinstallation;

import com.gastrack.model.KitOperationType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record KitInstallationResponse(
    Long id,
    Long kitId,
    String kitCode,
    Long addressId,
    String addressName,
    KitOperationType operationType,
    Long performedById,
    String performedByName,
    LocalDate operationDate,
    String notes,
    LocalDateTime createdAt
) {}
