package com.gastrack.service;

import com.gastrack.dto.device.DeviceProvisioningResponse;
import com.gastrack.model.Equipment;

public interface DeviceProvisioningService {

    void provisionInIoTCore(Equipment equipment);

    DeviceProvisioningResponse getCredentials(String serialNumber);

    /**
     * Deactivate the IoT credential of an equipment (default on kit REMOVED).
     * Local flag only ({@code DeviceCredential.active=false}); the Thing/certificate stay in IoT Core
     * so the device can be reused. No-op when the equipment has no credential.
     */
    void deactivateCredential(Equipment equipment);

    /**
     * Revoke the IoT credential of an equipment (on kit DECOMMISSIONED).
     * Deactivates the local flag and revokes the certificate in IoT Core (best-effort; missing AWS
     * credentials are swallowed like provisioning). No-op when the equipment has no credential.
     */
    void revokeCredential(Equipment equipment);
}
