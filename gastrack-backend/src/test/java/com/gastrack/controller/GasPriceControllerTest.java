package com.gastrack.controller;

import com.gastrack.dto.gasprice.GasPriceResponse;
import com.gastrack.model.GasType;
import com.gastrack.service.GasPriceService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class GasPriceControllerTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private GasPriceService gasPriceService;

    private MockMvc mockMvc;

    private static final String VALID_BODY =
        "{\"companyId\":1,\"gasType\":\"O2\",\"pricePerM3\":12.50}";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private GasPriceResponse response() {
        return new GasPriceResponse(1L, 1L, "Test Company", GasType.O2,
            BigDecimal.valueOf(12.50), "BRL", LocalDateTime.now(), true,
            LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return403_When_AdminCreates() throws Exception {
        mockMvc.perform(post("/api/v1/gas-prices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void should_Return201_When_SuperAdminCreates() throws Exception {
        when(gasPriceService.create(any())).thenReturn(response());

        mockMvc.perform(post("/api/v1/gas-prices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void should_Return400_When_CompanyIdMissing() throws Exception {
        mockMvc.perform(post("/api/v1/gas-prices")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gasType\":\"O2\",\"pricePerM3\":12.50}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return200_When_AdminListsByCompany() throws Exception {
        when(gasPriceService.findByCompany(eq(1L))).thenReturn(List.of(response()));

        mockMvc.perform(get("/api/v1/gas-prices").param("companyId", "1"))
            .andExpect(status().isOk());
    }
}
