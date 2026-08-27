package com.gastrack.dto.equipment;

public record BatchAssignmentError(
    Long equipmentId,
    String errorCode,
    String message
) {}
