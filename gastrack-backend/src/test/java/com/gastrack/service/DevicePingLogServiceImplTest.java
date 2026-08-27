package com.gastrack.service;

import com.gastrack.dto.device.DevicePingLogResponse;
import com.gastrack.mapper.DevicePingLogMapper;
import com.gastrack.model.DevicePingLog;
import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentType;
import com.gastrack.repository.DevicePingLogRepository;
import com.gastrack.repository.EquipmentRepository;
import com.gastrack.service.impl.DevicePingLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DevicePingLogServiceImplTest {

    @Mock
    private DevicePingLogRepository devicePingLogRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private DevicePingLogMapper devicePingLogMapper;

    @InjectMocks
    private DevicePingLogServiceImpl devicePingLogService;

    private static final String SERIAL_NUMBER = "ESP32-001";
    private static final String IP_ADDRESS = "192.168.1.100";

    private Equipment esp32Equipment;
    private EquipmentType esp32Type;
    private DevicePingLog savedPingLog;
    private DevicePingLogResponse pingLogResponse;

    @BeforeEach
    void setUp() {
        esp32Type = EquipmentType.builder()
                .id(1L)
                .name("ESP32")
                .build();

        esp32Equipment = Equipment.builder()
                .id(10L)
                .serialNumber(SERIAL_NUMBER)
                .assetTag("ESP32-TAG-001")
                .equipmentType(esp32Type)
                .active(true)
                .build();

        savedPingLog = DevicePingLog.builder()
                .id(1L)
                .serialNumber(SERIAL_NUMBER)
                .ipAddress(IP_ADDRESS)
                .equipment(esp32Equipment)
                .pingedAt(LocalDateTime.now())
                .build();

        pingLogResponse = new DevicePingLogResponse(
                1L, SERIAL_NUMBER, IP_ADDRESS, 10L, "ESP32-TAG-001",
                LocalDateTime.now(), true
        );
    }

    @Test
    void should_CreatePingLogWithEquipment_When_SerialMatchesEsp32() {
        when(equipmentRepository.findActiveBySerialNumber(SERIAL_NUMBER))
                .thenReturn(List.of(esp32Equipment));
        when(devicePingLogRepository.save(any(DevicePingLog.class))).thenReturn(savedPingLog);
        when(devicePingLogMapper.toResponse(savedPingLog)).thenReturn(pingLogResponse);

        DevicePingLogResponse result = devicePingLogService.ping(SERIAL_NUMBER, IP_ADDRESS);

        assertThat(result).isNotNull();
        assertThat(result.equipmentId()).isEqualTo(10L);
        assertThat(result.hasEquipment()).isTrue();

        ArgumentCaptor<DevicePingLog> captor = ArgumentCaptor.forClass(DevicePingLog.class);
        verify(devicePingLogRepository).save(captor.capture());
        assertThat(captor.getValue().getEquipment()).isEqualTo(esp32Equipment);
        assertThat(captor.getValue().getSerialNumber()).isEqualTo(SERIAL_NUMBER);
        assertThat(captor.getValue().getIpAddress()).isEqualTo(IP_ADDRESS);
    }

    @Test
    void should_CreatePingLogWithoutEquipment_When_SerialNotFound() {
        when(equipmentRepository.findActiveBySerialNumber(SERIAL_NUMBER))
                .thenReturn(Collections.emptyList());

        DevicePingLog savedUnknown = DevicePingLog.builder()
                .id(2L)
                .serialNumber(SERIAL_NUMBER)
                .ipAddress(IP_ADDRESS)
                .equipment(null)
                .pingedAt(LocalDateTime.now())
                .build();
        DevicePingLogResponse unknownResponse = new DevicePingLogResponse(
                2L, SERIAL_NUMBER, IP_ADDRESS, null, null,
                LocalDateTime.now(), false
        );

        when(devicePingLogRepository.save(any(DevicePingLog.class))).thenReturn(savedUnknown);
        when(devicePingLogMapper.toResponse(savedUnknown)).thenReturn(unknownResponse);

        DevicePingLogResponse result = devicePingLogService.ping(SERIAL_NUMBER, IP_ADDRESS);

        assertThat(result).isNotNull();
        assertThat(result.equipmentId()).isNull();
        assertThat(result.hasEquipment()).isFalse();

        ArgumentCaptor<DevicePingLog> captor = ArgumentCaptor.forClass(DevicePingLog.class);
        verify(devicePingLogRepository).save(captor.capture());
        assertThat(captor.getValue().getEquipment()).isNull();
    }

    @Test
    void should_IgnoreNonEsp32Equipment_When_SerialMatchesDifferentType() {
        EquipmentType sensorType = EquipmentType.builder().id(2L).name("Sensor").build();
        Equipment sensorEquipment = Equipment.builder()
                .id(20L)
                .serialNumber(SERIAL_NUMBER)
                .equipmentType(sensorType)
                .active(true)
                .build();

        when(equipmentRepository.findActiveBySerialNumber(SERIAL_NUMBER))
                .thenReturn(List.of(sensorEquipment));

        DevicePingLog savedUnlinked = DevicePingLog.builder()
                .id(3L).serialNumber(SERIAL_NUMBER).ipAddress(IP_ADDRESS)
                .equipment(null).pingedAt(LocalDateTime.now()).build();
        DevicePingLogResponse unlinkedResponse = new DevicePingLogResponse(
                3L, SERIAL_NUMBER, IP_ADDRESS, null, null, LocalDateTime.now(), false);

        when(devicePingLogRepository.save(any(DevicePingLog.class))).thenReturn(savedUnlinked);
        when(devicePingLogMapper.toResponse(savedUnlinked)).thenReturn(unlinkedResponse);

        DevicePingLogResponse result = devicePingLogService.ping(SERIAL_NUMBER, IP_ADDRESS);

        assertThat(result.equipmentId()).isNull();
    }

    @Test
    void should_ReturnPaginatedLogs_When_ListCalled() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<DevicePingLog> page = new PageImpl<>(List.of(savedPingLog), pageable, 1);

        when(devicePingLogRepository.search(eq("ESP32"), eq(false), eq(pageable))).thenReturn(page);
        when(devicePingLogMapper.toResponse(savedPingLog)).thenReturn(pingLogResponse);

        Page<DevicePingLogResponse> result = devicePingLogService.list(pageable, "ESP32", false);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().serialNumber()).isEqualTo(SERIAL_NUMBER);
        verify(devicePingLogRepository).search("ESP32", false, pageable);
    }

    @Test
    void should_FilterUnregisteredOnly_When_FlagIsTrue() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<DevicePingLog> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(devicePingLogRepository.search(eq(""), eq(true), eq(pageable))).thenReturn(emptyPage);

        Page<DevicePingLogResponse> result = devicePingLogService.list(pageable, null, true);

        assertThat(result.getContent()).isEmpty();
        verify(devicePingLogRepository).search("", true, pageable);
    }
}
