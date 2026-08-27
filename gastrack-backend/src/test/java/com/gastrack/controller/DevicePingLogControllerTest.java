package com.gastrack.controller;

import com.gastrack.dto.device.DevicePingLogResponse;
import com.gastrack.service.DevicePingLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("DevicePingLogController Tests")
class DevicePingLogControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DevicePingLogService devicePingLogService;

    @InjectMocks
    private DevicePingLogController controller;

    private DevicePingLogResponse testResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        testResponse = new DevicePingLogResponse(
                1L, "ESP32-001", "192.168.1.100", 10L, "ESP32-TAG-001",
                LocalDateTime.of(2026, 3, 4, 12, 0), true
        );
    }

    @Test
    @DisplayName("should_ReturnPaginatedLogs_When_ListCalled")
    void should_ReturnPaginatedLogs_When_ListCalled() throws Exception {
        Pageable pageable = PageRequest.of(0, 20);
        Page<DevicePingLogResponse> page = new PageImpl<>(List.of(testResponse), pageable, 1);

        when(devicePingLogService.list(any(Pageable.class), isNull(), eq(false))).thenReturn(page);

        mockMvc.perform(get("/api/v1/device-ping-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].serialNumber", is("ESP32-001")))
                .andExpect(jsonPath("$.content[0].hasEquipment", is(true)));
    }

    @Test
    @DisplayName("should_PassSerialFilter_When_Provided")
    void should_PassSerialFilter_When_Provided() throws Exception {
        Page<DevicePingLogResponse> page = new PageImpl<>(List.of(testResponse), PageRequest.of(0, 20), 1);

        when(devicePingLogService.list(any(Pageable.class), eq("ESP32"), eq(false))).thenReturn(page);

        mockMvc.perform(get("/api/v1/device-ping-logs")
                        .param("serial", "ESP32"))
                .andExpect(status().isOk());

        verify(devicePingLogService).list(any(Pageable.class), eq("ESP32"), eq(false));
    }

    @Test
    @DisplayName("should_PassUnregisteredFilter_When_True")
    void should_PassUnregisteredFilter_When_True() throws Exception {
        Page<DevicePingLogResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);

        when(devicePingLogService.list(any(Pageable.class), isNull(), eq(true))).thenReturn(page);

        mockMvc.perform(get("/api/v1/device-ping-logs")
                        .param("unregistered", "true"))
                .andExpect(status().isOk());

        verify(devicePingLogService).list(any(Pageable.class), isNull(), eq(true));
    }
}
