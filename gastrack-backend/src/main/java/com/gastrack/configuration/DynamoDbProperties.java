package com.gastrack.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "aws.dynamodb")
@Getter
@Setter
public class DynamoDbProperties {

    private String region;
    private String tableName;
}
