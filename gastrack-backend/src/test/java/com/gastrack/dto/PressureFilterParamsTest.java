package com.gastrack.dto;

import com.gastrack.dto.pressure.PressureFilterParams;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PressureFilterParamsTest {

    // --- validate() ---

    @Test
    void should_ThrowException_When_DeviceIdIsNull() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId(null)
                .build();

        assertThatThrownBy(params::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("deviceId is required");
    }

    @Test
    void should_ThrowException_When_DeviceIdIsBlank() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("   ")
                .build();

        assertThatThrownBy(params::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("deviceId is required");
    }

    @Test
    void should_ThrowException_When_StartTimestampAfterEndTimestamp() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("DEVICE1")
                .startTimestamp(2000L)
                .endTimestamp(1000L)
                .build();

        assertThatThrownBy(params::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("startTimestamp must be before endTimestamp");
    }

    @Test
    void should_ThrowException_When_StartTimestampEqualsEndTimestamp() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("DEVICE1")
                .startTimestamp(1000L)
                .endTimestamp(1000L)
                .build();

        assertThatThrownBy(params::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("startTimestamp must be before endTimestamp");
    }

    @Test
    void should_PassValidation_When_ValidParams() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("DEVICE1")
                .startTimestamp(1000L)
                .endTimestamp(2000L)
                .build();

        params.validate(); // should not throw
    }

    @Test
    void should_PassValidation_When_NoTimestamps() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("DEVICE1")
                .build();

        params.validate(); // should not throw
    }

    // --- getLimitOrDefault() ---

    @Test
    void should_ReturnDefaultLimit_When_LimitIsNull() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .limit(null)
                .build();

        assertThat(params.getLimitOrDefault()).isEqualTo(50);
    }

    @Test
    void should_ReturnDefaultLimit_When_LimitIsZero() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .limit(0)
                .build();

        assertThat(params.getLimitOrDefault()).isEqualTo(50);
    }

    @Test
    void should_ReturnDefaultLimit_When_LimitIsNegative() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .limit(-5)
                .build();

        assertThat(params.getLimitOrDefault()).isEqualTo(50);
    }

    @Test
    void should_ReturnRequestedLimit_When_WithinBounds() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .limit(100)
                .build();

        assertThat(params.getLimitOrDefault()).isEqualTo(100);
    }

    @Test
    void should_CapLimitAt500_When_LimitExceedsMax() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .limit(9999)
                .build();

        assertThat(params.getLimitOrDefault()).isEqualTo(500);
    }

    @Test
    void should_Return500_When_LimitIsExactly500() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .limit(500)
                .build();

        assertThat(params.getLimitOrDefault()).isEqualTo(500);
    }

    // --- getEffectiveStartTimestamp() / getEffectiveEndTimestamp() ---

    @Test
    void should_ReturnProvidedTimestamp_When_StartTimestampIsSet() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .startTimestamp(123456L)
                .endTimestamp(200000L)
                .build();

        assertThat(params.getEffectiveStartTimestamp()).isEqualTo(123456L);
    }

    @Test
    void should_ReturnProvidedTimestamp_When_EndTimestampIsSet() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .endTimestamp(789012L)
                .build();

        assertThat(params.getEffectiveEndTimestamp()).isEqualTo(789012L);
    }

    @Test
    void should_ReturnLast30Minutes_When_StartTimestampIsNull() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .build();

        long now = Instant.now().getEpochSecond();
        long effectiveStart = params.getEffectiveStartTimestamp();

        // Should be approximately 30 minutes ago (within 2s tolerance)
        assertThat(effectiveStart).isBetween(now - 1_802L, now - 1_798L);
    }

    @Test
    void should_ReturnNow_When_EndTimestampIsNull() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .build();

        long now = Instant.now().getEpochSecond();
        long effectiveEnd = params.getEffectiveEndTimestamp();

        assertThat(effectiveEnd).isBetween(now - 2L, now + 2L);
    }

    @Test
    void should_UseProvidedStartTimestamp_When_ProvidedWindowIsTooShort() {
        PressureFilterParams params = PressureFilterParams.builder()
                .deviceId("D1")
                .startTimestamp(1_000L)
                .endTimestamp(2_000L)
                .build();

        assertThat(params.getEffectiveStartTimestamp()).isEqualTo(1_000L);
    }
}
