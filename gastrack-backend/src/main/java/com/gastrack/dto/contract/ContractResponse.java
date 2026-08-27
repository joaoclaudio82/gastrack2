package com.gastrack.dto.contract;

import com.gastrack.model.ContractStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ContractResponse(
    Long id,
    Long companyId,
    String companyName,
    String contractNumber,
    LocalDate startDate,
    LocalDate endDate,
    Integer kitQuantity,
    List<Long> allowedAddressIds,
    Integer activeKitsCount,
    Integer remainingKitCapacity,
    ContractStatus status,
    String notes,
    Boolean active,
    List<Long> addressIds,
    Long createdById,
    String createdByName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
