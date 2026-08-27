package com.gastrack.controller;

import com.gastrack.dto.cylindermodel.CylinderModelResponse;
import com.gastrack.model.GasType;
import com.gastrack.service.CylinderModelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class CylinderModelControllerTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private CylinderModelService cylinderModelService;

    private MockMvc mockMvc;

    private static final String VALID_BODY =
        "{\"codigo\":\"O2-50L-200BAR\",\"gasType\":\"O2\",\"waterVolumeLiters\":50,\"capacityBar\":200}";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private CylinderModelResponse response() {
        return new CylinderModelResponse(1L, "O2-50L-200BAR", GasType.O2,
            BigDecimal.valueOf(50), BigDecimal.valueOf(200), true,
            LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return403_When_AdminCreates() throws Exception {
        mockMvc.perform(post("/api/v1/cylinder-models")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void should_Return201_When_SuperAdminCreates() throws Exception {
        when(cylinderModelService.create(any())).thenReturn(response());

        mockMvc.perform(post("/api/v1/cylinder-models")
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_BODY))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void should_Return400_When_CodigoMissing() throws Exception {
        mockMvc.perform(post("/api/v1/cylinder-models")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gasType\":\"O2\",\"waterVolumeLiters\":50,\"capacityBar\":200}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_Return200_When_AdminLists() throws Exception {
        Page<CylinderModelResponse> page = new PageImpl<>(List.of(response()));
        when(cylinderModelService.findAll(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/cylinder-models"))
            .andExpect(status().isOk());
    }
}
