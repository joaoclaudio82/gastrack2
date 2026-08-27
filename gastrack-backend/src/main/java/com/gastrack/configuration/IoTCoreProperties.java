package com.gastrack.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "aws.iot")
@Getter
@Setter
public class IoTCoreProperties {

    private String region;
    private String policyName;
}
