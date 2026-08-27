package com.gastrack.controller;

import com.gastrack.dto.refill.RefillEventResponse;
import com.gastrack.model.RefillSource;
import com.gastrack.service.RefillService;
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
class RefillControllerTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private RefillService refillService;

    private MockMvc mockMvc;

    private static final String VALID_BODY = "{\"serialNumber\":\"SN-NEW\",\"cylinderModelId\":5}";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private RefillEventResponse response() {
        return new RefillEventResponse(1L, 100L, LocalDateTime.now(), null, null, RefillSource.MANUAL, 2L, "SN-NEW");
    }

    @Test
    @WithMockUser(roles = "USER")
    void should_Return201_When_UserRegistersRefill() throws Exception {
        when(refillService.registerRefill(eq(100L), any())).thenReturn(response());

        mockMvc.perform(post("/api/v1/gas-points/100/refill")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "USER")
    void should_Return400_When_SerialMissing() throws Exception {
        mockMvc.perform(post("/api/v1/gas-points/100/refill")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cylinderModelId\":5}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return200_When_ListingRefills() throws Exception {
        when(refillService.findByGasPoint(100L)).thenReturn(List.of(response()));

        mockMvc.perform(get("/api/v1/gas-points/100/refills"))
            .andExpect(status().isOk());
    }
}
