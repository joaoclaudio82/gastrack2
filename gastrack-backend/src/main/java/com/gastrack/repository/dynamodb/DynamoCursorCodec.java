package com.gastrack.repository.dynamodb;

import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public final class DynamoCursorCodec {

    private static final String FIELD_SEPARATOR = "|";
    private static final String KV_SEPARATOR = "=";
    private static final String TYPE_STRING = "S";
    private static final String TYPE_NUMBER = "N";

    private DynamoCursorCodec() {
    }

    public static String encode(Map<String, AttributeValue> lastEvaluatedKey) {
        if (lastEvaluatedKey == null || lastEvaluatedKey.isEmpty()) {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, AttributeValue> entry : lastEvaluatedKey.entrySet()) {
            if (!first) {
                sb.append(FIELD_SEPARATOR);
            }
            first = false;

            AttributeValue val = entry.getValue();
            if (val.s() != null) {
                sb.append(entry.getKey()).append(KV_SEPARATOR).append(TYPE_STRING).append(KV_SEPARATOR).append(val.s());
            } else if (val.n() != null) {
                sb.append(entry.getKey()).append(KV_SEPARATOR).append(TYPE_NUMBER).append(KV_SEPARATOR).append(val.n());
            }
        }

        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    public static Map<String, AttributeValue> decode(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        byte[] decoded;
        try {
            decoded = Base64.getUrlDecoder().decode(cursor);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid cursor format");
        }

        String raw = new String(decoded, StandardCharsets.UTF_8);
        String[] fields = raw.split("\\" + FIELD_SEPARATOR);
        Map<String, AttributeValue> key = new HashMap<>();

        for (String field : fields) {
            String[] parts = field.split(KV_SEPARATOR, 3);
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid cursor format");
            }

            String name = parts[0];
            String type = parts[1];
            String value = parts[2];

            AttributeValue attrValue = switch (type) {
                case TYPE_STRING -> AttributeValue.builder().s(value).build();
                case TYPE_NUMBER -> AttributeValue.builder().n(value).build();
                default -> throw new IllegalArgumentException("Invalid cursor format");
            };

            key.put(name, attrValue);
        }

        return key;
    }
}
