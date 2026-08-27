package com.gastrack.dto.refill;

import com.gastrack.model.RefillSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefillEventResponse(
    Long id,
    Long gasPointId,
    LocalDateTime detectedAt,
    BigDecimal fromFill,
    BigDecimal toFill,
    RefillSource source,
    Long cylinderId,
    String cylinderSerialNumber
) {}
