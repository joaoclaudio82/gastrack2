package com.gastrack.dto.equipment;

import java.util.List;

public record EquipmentBatchAssignResponse(
    int totalRequested,
    int successCount,
    int failureCount,
    List<EquipmentResponse> assigned,
    List<BatchAssignmentError> errors
) {}
