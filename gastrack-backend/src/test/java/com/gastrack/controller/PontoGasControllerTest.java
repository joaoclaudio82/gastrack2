package com.gastrack.controller;

import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.model.CylinderStatus;
import com.gastrack.service.PontoGasService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class PontoGasControllerTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private PontoGasService pontoGasService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private PontoGasResponse response() {
        return new PontoGasResponse(1L, 1L, "Filial", "Sala 1",
            BigDecimal.valueOf(15), BigDecimal.valueOf(200),
            new PontoGasResponse.ThresholdsView(20, 50, 80),
            BigDecimal.valueOf(70), LocalDateTime.now(), CylinderStatus.NORMAL,
            true, LocalDateTime.now(), LocalDateTime.now(), null,
            java.util.List.of(), BigDecimal.valueOf(0.35), 50.0, null);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return200_When_AdminPushesReading() throws Exception {
        when(pontoGasService.updateStatus(eq(1L), any())).thenReturn(response());

        mockMvc.perform(patch("/api/v1/gas-points/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPressureBar\":70}"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return400_When_PressureMissing() throws Exception {
        mockMvc.perform(patch("/api/v1/gas-points/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "USER")
    void should_Return403_When_UserPushesReading() throws Exception {
        mockMvc.perform(patch("/api/v1/gas-points/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPressureBar\":70}"))
            .andExpect(status().isForbidden());
    }
}
