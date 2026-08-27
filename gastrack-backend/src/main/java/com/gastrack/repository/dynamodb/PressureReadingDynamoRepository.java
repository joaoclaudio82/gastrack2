package com.gastrack.repository.dynamodb;

import com.gastrack.configuration.DynamoDbProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Slf4j
public class PressureReadingDynamoRepository {

    private static final String ATTR_DEVICE_ID = "device_id";
    private static final String ATTR_SENSOR_ID = "sensor_id";
    private static final String ATTR_TIMESTAMP = "timestamp";
    private static final String TIMESTAMP_PLACEHOLDER = "#ts";

    /**
     * Itens varridos para achar a última leitura de UMA porta. Um ESP32 tem até 8 sensores,
     * então 64 cobre ~8 rodadas de leitura.
     * ponytail: varredura fixa; virar GSI (device_id, sensor_id) se o custo de RCU incomodar.
     */
    private static final int LATEST_SCAN_LIMIT = 64;

    private final DynamoDbClient dynamoDbClient;
    private final DynamoDbProperties dynamoDbProperties;

    /**
     * Última leitura de um sensor, ou vazio se não houver nenhuma na janela.
     *
     * O filtro de sensor_id no Dynamo é aplicado DEPOIS do limit, então pedir 1 item
     * devolveria vazio sempre que a leitura mais recente do device for de outra porta.
     * Daí a janela de {@value #LATEST_SCAN_LIMIT} itens.
     */
    public Optional<Map<String, AttributeValue>> findLatest(String deviceId, Integer sensorId, long startTs, long endTs) {
        DynamoPageResult page = queryPage(deviceId, sensorId, startTs, endTs, LATEST_SCAN_LIMIT, null);
        return page.items().stream().findFirst();
    }

    public DynamoPageResult queryPage(
            String deviceId,
            Integer sensorId,
            long startTs,
            long endTs,
            int limit,
            Map<String, AttributeValue> exclusiveStartKey
    ) {
        log.debug("Querying pressure readings - device: {}, sensorId: {}, range: [{}, {}], limit: {}",
                deviceId, sensorId, startTs, endTs, limit);

        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":deviceId", AttributeValue.builder().s(deviceId).build());
        expressionValues.put(":startTs", AttributeValue.builder().n(Long.toString(startTs)).build());
        expressionValues.put(":endTs", AttributeValue.builder().n(Long.toString(endTs)).build());

        boolean filterBySensor = sensorId != null && sensorId >= 1 && sensorId <= 8;
        if (filterBySensor) {
            expressionValues.put(":sensorId", AttributeValue.builder().n(String.valueOf(sensorId)).build());
        }

        QueryRequest.Builder requestBuilder = QueryRequest.builder()
                .tableName(dynamoDbProperties.getTableName())
                .keyConditionExpression(ATTR_DEVICE_ID + " = :deviceId AND " + TIMESTAMP_PLACEHOLDER + " BETWEEN :startTs AND :endTs")
                .expressionAttributeNames(Map.of(TIMESTAMP_PLACEHOLDER, ATTR_TIMESTAMP))
                .expressionAttributeValues(expressionValues)
                .scanIndexForward(false)
                .limit(limit);

        if (filterBySensor) {
            requestBuilder.filterExpression(ATTR_SENSOR_ID + " = :sensorId");
        }

        if (exclusiveStartKey != null && !exclusiveStartKey.isEmpty()) {
            requestBuilder.exclusiveStartKey(exclusiveStartKey);
        }

        QueryResponse response;
        try {
            response = dynamoDbClient.query(requestBuilder.build());
        } catch (SdkClientException ex) {
            log.warn("DynamoDB unavailable for pressure query (credentials/network). Returning empty result. Cause: {}",
                    ex.getMessage());
            return DynamoPageResult.empty();
        }

        log.debug("Query returned {} items, hasMore: {}",
                response.items().size(),
                response.lastEvaluatedKey() != null && !response.lastEvaluatedKey().isEmpty());

        return DynamoPageResult.of(response.items(), response.lastEvaluatedKey());
    }
}
