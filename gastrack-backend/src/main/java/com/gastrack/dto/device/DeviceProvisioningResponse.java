package com.gastrack.dto.device;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeviceProvisioningResponse {

    private String thingName;
    private String certificatePem;
    private String privateKey;
    private String publicKey;
    private String iotEndpoint;
    private boolean alreadyProvisioned;
}
