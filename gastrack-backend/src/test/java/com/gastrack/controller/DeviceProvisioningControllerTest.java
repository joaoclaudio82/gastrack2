package com.gastrack.controller;

import com.gastrack.dto.device.DevicePingLogResponse;
import com.gastrack.dto.device.DeviceProvisioningResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.service.DevicePingLogService;
import com.gastrack.service.DeviceProvisioningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeviceProvisioningController Tests")
class DeviceProvisioningControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DeviceProvisioningService deviceProvisioningService;

    @Mock
    private DevicePingLogService devicePingLogService;

    @InjectMocks
    private DeviceProvisioningController controller;

    private static final String SERIAL_NUMBER = "ESP32-SERIAL-001";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("should_Return200AndLogPing_When_CredentialsExist")
    void should_Return200AndLogPing_When_CredentialsExist() throws Exception {
        DevicePingLogResponse pingResponse = new DevicePingLogResponse(
                1L, SERIAL_NUMBER, "127.0.0.1", 10L, "ESP32-TAG-001",
                LocalDateTime.now(), true
        );
        when(devicePingLogService.ping(eq(SERIAL_NUMBER), anyString())).thenReturn(pingResponse);

        DeviceProvisioningResponse response = DeviceProvisioningResponse.builder()
                .thingName(SERIAL_NUMBER)
                .certificatePem("-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----")
                .privateKey("-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----")
                .publicKey("-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----")
                .iotEndpoint("xxx-ats.iot.us-east-1.amazonaws.com")
                .alreadyProvisioned(true)
                .build();
        when(deviceProvisioningService.getCredentials(SERIAL_NUMBER)).thenReturn(response);

        mockMvc.perform(get("/api/v1/devices/{serialNumber}/credentials", SERIAL_NUMBER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thingName", is(SERIAL_NUMBER)))
                .andExpect(jsonPath("$.iotEndpoint", is("xxx-ats.iot.us-east-1.amazonaws.com")))
                .andExpect(jsonPath("$.alreadyProvisioned", is(true)));

        verify(devicePingLogService).ping(eq(SERIAL_NUMBER), anyString());
    }

    @Test
    @DisplayName("should_Return404ButStillLogPing_When_CredentialsNotFound")
    void should_Return404ButStillLogPing_When_CredentialsNotFound() throws Exception {
        DevicePingLogResponse pingResponse = new DevicePingLogResponse(
                2L, "NONEXISTENT", "127.0.0.1", null, null,
                LocalDateTime.now(), false
        );
        when(devicePingLogService.ping(eq("NONEXISTENT"), anyString())).thenReturn(pingResponse);
        when(deviceProvisioningService.getCredentials("NONEXISTENT"))
                .thenThrow(new ResourceNotFoundException("DeviceCredential", "serialNumber", "NONEXISTENT"));

        mockMvc.perform(get("/api/v1/devices/{serialNumber}/credentials", "NONEXISTENT"))
                .andExpect(status().isNotFound());

        verify(devicePingLogService).ping(eq("NONEXISTENT"), anyString());
    }
}
