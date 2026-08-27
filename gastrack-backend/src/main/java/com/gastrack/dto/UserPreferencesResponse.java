package com.gastrack.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO exposing user's application preferences.
 */
@Schema(description = "User application preferences")
public record UserPreferencesResponse(
    @Schema(description = "Refresh interval in seconds for analytics streaming chart (1-30)", example = "5")
    Integer analyticsRefreshIntervalSeconds,

    @Schema(description = "Whether the analytics streaming is paused", example = "false")
    Boolean analyticsStreamingPaused
) {}
