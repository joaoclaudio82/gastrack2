package com.gastrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gastrack.dto.UpdateUserPreferencesRequest;
import com.gastrack.dto.UserPreferencesResponse;
import com.gastrack.exceptions.ValidationAdvice;
import com.gastrack.service.UserPreferencesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserPreferencesController Tests")
class UserPreferencesControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserPreferencesService service;

    @InjectMocks
    private UserPreferencesController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ValidationAdvice())
                .build();
    }

    @Test
    void should_Return200WithPreferences_When_GetCurrent() throws Exception {
        when(service.getCurrent()).thenReturn(new UserPreferencesResponse(5, false));

        mockMvc.perform(get("/api/v1/users/me/preferences"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.analyticsRefreshIntervalSeconds").value(5))
            .andExpect(jsonPath("$.analyticsStreamingPaused").value(false));
    }

    @Test
    void should_Return200WithUpdated_When_PutValidPayload() throws Exception {
        when(service.updateCurrent(any(UpdateUserPreferencesRequest.class)))
            .thenReturn(new UserPreferencesResponse(12, true));

        UpdateUserPreferencesRequest body = new UpdateUserPreferencesRequest(12, true);

        mockMvc.perform(put("/api/v1/users/me/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.analyticsRefreshIntervalSeconds").value(12))
            .andExpect(jsonPath("$.analyticsStreamingPaused").value(true));
    }

    @Test
    void should_Return400_When_IntervalBelowMin() throws Exception {
        UpdateUserPreferencesRequest body = new UpdateUserPreferencesRequest(0, null);

        mockMvc.perform(put("/api/v1/users/me/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void should_Return400_When_IntervalAboveMax() throws Exception {
        UpdateUserPreferencesRequest body = new UpdateUserPreferencesRequest(31, null);

        mockMvc.perform(put("/api/v1/users/me/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }
}
