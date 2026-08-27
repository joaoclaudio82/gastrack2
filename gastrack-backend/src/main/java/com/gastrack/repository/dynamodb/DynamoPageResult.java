package com.gastrack.repository.dynamodb;

import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.List;
import java.util.Map;

public record DynamoPageResult(
        List<Map<String, AttributeValue>> items,
        Map<String, AttributeValue> lastEvaluatedKey,
        boolean hasMore
) {

    public static DynamoPageResult of(
            List<Map<String, AttributeValue>> items,
            Map<String, AttributeValue> lastEvaluatedKey
    ) {
        boolean hasMore = lastEvaluatedKey != null && !lastEvaluatedKey.isEmpty();
        return new DynamoPageResult(items, hasMore ? lastEvaluatedKey : null, hasMore);
    }

    public static DynamoPageResult empty() {
        return new DynamoPageResult(List.of(), null, false);
    }
}
