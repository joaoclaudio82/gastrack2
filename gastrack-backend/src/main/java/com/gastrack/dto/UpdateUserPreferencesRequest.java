package com.gastrack.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Partial-update request for user preferences. Null fields keep current values.
 */
@Schema(description = "Partial update payload for user preferences")
public record UpdateUserPreferencesRequest(
    @Min(value = 1, message = "analyticsRefreshIntervalSeconds must be >= 1")
    @Max(value = 30, message = "analyticsRefreshIntervalSeconds must be <= 30")
    @Schema(description = "Refresh interval in seconds (1-30)", example = "10", nullable = true)
    Integer analyticsRefreshIntervalSeconds,

    @Schema(description = "Pause/resume streaming", example = "false", nullable = true)
    Boolean analyticsStreamingPaused
) {}
