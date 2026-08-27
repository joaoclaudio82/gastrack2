package com.gastrack.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "device.provisioning")
@Getter
@Setter
public class DeviceProvisioningProperties {

    private String apiKey;

    /**
     * Quando {@code false}, não chama AWS IoT Core ao criar equipamento ESP32 (útil em dev sem credenciais IAM).
     */
    private boolean iotProvisioningEnabled = true;
}
