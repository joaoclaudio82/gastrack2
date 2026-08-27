package com.gastrack.repository;

import com.gastrack.repository.dynamodb.DynamoCursorCodec;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DynamoCursorCodecTest {

    // --- encode() ---

    @Test
    void should_ReturnNull_When_EncodingNullKey() {
        assertThat(DynamoCursorCodec.encode(null)).isNull();
    }

    @Test
    void should_ReturnNull_When_EncodingEmptyKey() {
        assertThat(DynamoCursorCodec.encode(Map.of())).isNull();
    }

    @Test
    void should_EncodeStringAttribute() {
        Map<String, AttributeValue> key = Map.of(
                "device_id", AttributeValue.builder().s("ABC123").build()
        );

        String encoded = DynamoCursorCodec.encode(key);

        assertThat(encoded).isNotNull().isNotBlank();
        // Should be URL-safe Base64 without padding
        assertThat(encoded).doesNotContain("+", "/", "=");
    }

    @Test
    void should_EncodeNumberAttribute() {
        Map<String, AttributeValue> key = Map.of(
                "timestamp", AttributeValue.builder().n("1234567890").build()
        );

        String encoded = DynamoCursorCodec.encode(key);

        assertThat(encoded).isNotNull().isNotBlank();
    }

    @Test
    void should_EncodeMultipleAttributes() {
        Map<String, AttributeValue> key = new LinkedHashMap<>();
        key.put("device_id", AttributeValue.builder().s("ABC123").build());
        key.put("timestamp", AttributeValue.builder().n("1234567890").build());

        String encoded = DynamoCursorCodec.encode(key);

        assertThat(encoded).isNotNull();
    }

    // --- decode() ---

    @Test
    void should_ReturnNull_When_DecodingNull() {
        assertThat(DynamoCursorCodec.decode(null)).isNull();
    }

    @Test
    void should_ReturnNull_When_DecodingBlank() {
        assertThat(DynamoCursorCodec.decode("   ")).isNull();
    }

    @Test
    void should_ThrowException_When_DecodingInvalidBase64() {
        assertThatThrownBy(() -> DynamoCursorCodec.decode("!!!not-base64!!!"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid cursor format");
    }

    @Test
    void should_ThrowException_When_DecodingMalformedContent() {
        // Valid Base64 but invalid internal structure
        String badCursor = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("garbage-no-separator".getBytes());

        assertThatThrownBy(() -> DynamoCursorCodec.decode(badCursor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid cursor format");
    }

    @Test
    void should_ThrowException_When_DecodingUnknownType() {
        String badCursor = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("field=X=value".getBytes());

        assertThatThrownBy(() -> DynamoCursorCodec.decode(badCursor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid cursor format");
    }

    // --- roundtrip ---

    @Test
    void should_RoundtripStringAttribute() {
        Map<String, AttributeValue> original = Map.of(
                "device_id", AttributeValue.builder().s("4036EB1815AC").build()
        );

        String encoded = DynamoCursorCodec.encode(original);
        Map<String, AttributeValue> decoded = DynamoCursorCodec.decode(encoded);

        assertThat(decoded).containsKey("device_id");
        assertThat(decoded.get("device_id").s()).isEqualTo("4036EB1815AC");
    }

    @Test
    void should_RoundtripNumberAttribute() {
        Map<String, AttributeValue> original = Map.of(
                "timestamp", AttributeValue.builder().n("1771330872").build()
        );

        String encoded = DynamoCursorCodec.encode(original);
        Map<String, AttributeValue> decoded = DynamoCursorCodec.decode(encoded);

        assertThat(decoded).containsKey("timestamp");
        assertThat(decoded.get("timestamp").n()).isEqualTo("1771330872");
    }

    @Test
    void should_RoundtripCompositeKey() {
        Map<String, AttributeValue> original = new LinkedHashMap<>();
        original.put("device_id", AttributeValue.builder().s("4036EB1815AC").build());
        original.put("timestamp", AttributeValue.builder().n("1771330872").build());

        String encoded = DynamoCursorCodec.encode(original);
        Map<String, AttributeValue> decoded = DynamoCursorCodec.decode(encoded);

        assertThat(decoded).hasSize(2);
        assertThat(decoded.get("device_id").s()).isEqualTo("4036EB1815AC");
        assertThat(decoded.get("timestamp").n()).isEqualTo("1771330872");
    }

    @Test
    void should_ProduceUrlSafeToken() {
        Map<String, AttributeValue> key = new LinkedHashMap<>();
        key.put("device_id", AttributeValue.builder().s("ABC+DEF/GHI=JKL").build());
        key.put("timestamp", AttributeValue.builder().n("9999999999").build());

        String encoded = DynamoCursorCodec.encode(key);

        // Must be URL-safe (no +, /, =)
        assertThat(encoded).doesNotContain("+", "/", "=");
    }
}
