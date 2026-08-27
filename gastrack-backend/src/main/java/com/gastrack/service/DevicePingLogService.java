package com.gastrack.service;

import com.gastrack.dto.device.DevicePingLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DevicePingLogService {

    DevicePingLogResponse ping(String serialNumber, String ipAddress);

    Page<DevicePingLogResponse> list(Pageable pageable, String serial, boolean unregisteredOnly);
}
