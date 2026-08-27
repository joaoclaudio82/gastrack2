package com.gastrack.dto.movementhistory;

import com.gastrack.model.MovementOperation;

import java.time.LocalDateTime;

public record MovementHistoryResponse(
    Long id,
    Long equipmentId,
    String equipmentAssetTag,
    Long equipmentKitId,
    String kitCode,
    Long userId,
    String userName,
    MovementOperation operation,
    LocalDateTime operationAt,
    Long fromKitId,
    String fromKitCode,
    Long toKitId,
    String toKitCode,
    String notes
) {}
