package com.gastrack.dto.device;

import java.time.LocalDateTime;

public record DevicePingLogResponse(
        Long id,
        String serialNumber,
        String ipAddress,
        Long equipmentId,
        String equipmentAssetTag,
        LocalDateTime pingedAt,
        boolean hasEquipment
) {
}
