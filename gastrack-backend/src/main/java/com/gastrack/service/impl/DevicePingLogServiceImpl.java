package com.gastrack.service.impl;

import com.gastrack.dto.device.DevicePingLogResponse;
import com.gastrack.mapper.DevicePingLogMapper;
import com.gastrack.model.DevicePingLog;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.DevicePingLogRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.service.DevicePingLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DevicePingLogServiceImpl implements DevicePingLogService {

    private static final String ESP32_TYPE_NAME = EquipmentType.ESP32_TYPE_NAME;

    private final DevicePingLogRepository devicePingLogRepository;
    private final EquipmentRepository equipmentRepository;
    private final DevicePingLogMapper devicePingLogMapper;

    @Override
    @Transactional
    public DevicePingLogResponse ping(String serialNumber, String ipAddress) {
        Equipment equipment = findEsp32Equipment(serialNumber);

        DevicePingLog pingLog = DevicePingLog.builder()
                .serialNumber(serialNumber)
                .ipAddress(ipAddress)
                .equipment(equipment)
                .build();

        DevicePingLog saved = devicePingLogRepository.save(pingLog);
        log.info("Device ping logged: serial={}, equipment={}, ip={}",
                serialNumber, equipment != null ? equipment.getId() : "unknown", ipAddress);

        return devicePingLogMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DevicePingLogResponse> list(Pageable pageable, String serial, boolean unregisteredOnly) {
        String serialFilter = serial != null ? serial.trim() : "";
        // Native query has its own ORDER BY, so strip sort from Pageable to avoid camelCase column errors
        Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return devicePingLogRepository.search(serialFilter, unregisteredOnly, unsorted)
                .map(devicePingLogMapper::toResponse);
    }

    private Equipment findEsp32Equipment(String serialNumber) {
        List<Equipment> equipments = equipmentRepository.findActiveBySerialNumber(serialNumber);
        return equipments.stream()
                .filter(e -> ESP32_TYPE_NAME.equalsIgnoreCase(e.getEquipmentType().getName()))
                .findFirst()
                .orElse(null);
    }
}
