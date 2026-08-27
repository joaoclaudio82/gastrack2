package com.gastrack.components;

import com.gastrack.configuration.IoTCoreProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.iot.IotClient;

@Component
@RequiredArgsConstructor
public class IoTCoreClientFactory {

    private final IoTCoreProperties iotProperties;

    public IotClient createClient() {
        return IotClient.builder()
                .region(Region.of(iotProperties.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
