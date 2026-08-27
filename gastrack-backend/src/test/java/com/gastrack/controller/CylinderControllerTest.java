package com.gastrack.controller;

import com.gastrack.dto.cylinder.CylinderResponse;
import com.gastrack.service.CylinderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class CylinderControllerTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private CylinderService cylinderService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_NotExpose_CylinderStatusEndpoint() throws Exception {
        // PATCH /cylinders/{id}/status was moved to the gas point; it must no longer exist.
        mockMvc.perform(patch("/api/v1/cylinders/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPressureBar\":70}"))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_SortByCreatedAtDesc_When_ClientSendsNoSort() throws Exception {
        when(cylinderService.findAll(any(), any(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/cylinders").param("page", "0").param("size", "20"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(cylinderService).findAll(captor.capture(), any(), any(), any());
        assertThat(captor.getValue().getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_RespectClientSort_When_SortParamIsSent() throws Exception {
        when(cylinderService.findAll(any(), any(), any(), any()))
            .thenReturn(Page.<CylinderResponse>empty());

        mockMvc.perform(get("/api/v1/cylinders").param("sort", "serialNumber,asc"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(cylinderService).findAll(captor.capture(), any(), any(), any());
        assertThat(captor.getValue().getSort())
            .isEqualTo(Sort.by(Sort.Direction.ASC, "serialNumber"));
    }
}
