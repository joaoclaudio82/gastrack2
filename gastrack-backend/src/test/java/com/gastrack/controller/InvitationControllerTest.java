package com.gastrack.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gastrack.dto.invitation.CreateInvitationRequest;
import com.gastrack.dto.invitation.InvitationResponse;
import com.gastrack.model.InvitationStatus;
import com.gastrack.model.UserRole;
import com.gastrack.service.InvitationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvitationController Tests")
class InvitationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private InvitationService invitationService;

    @InjectMocks
    private InvitationController invitationController;

    private InvitationResponse testResponse;
    private CreateInvitationRequest testRequest;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // For LocalDateTime serialization
        mockMvc = MockMvcBuilders.standaloneSetup(invitationController)
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .build();

        testResponse = new InvitationResponse(
            1L, "invited@test.com", UserRole.USER, 1L, "Test Company",
            InvitationStatus.PENDING, LocalDateTime.now().plusDays(7),
            LocalDateTime.now(), "admin@test.com"
        );

        testRequest = new CreateInvitationRequest(
            "invited@test.com", UserRole.USER, null, "John", "Doe"
        );
    }

    @Nested
    @DisplayName("POST /api/v1/admin/invites")
    class CreateInvitationEndpoint {

        @Test
        @DisplayName("should return 201 when valid request")
        void should_Return201_When_ValidRequest() throws Exception {
            when(invitationService.createInvitation(any(CreateInvitationRequest.class)))
                .thenReturn(testResponse);

            mockMvc.perform(post("/api/v1/admin/invites")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.email", is("invited@test.com")))
                .andExpect(jsonPath("$.role", is("USER")))
                .andExpect(jsonPath("$.status", is("PENDING")));

            verify(invitationService).createInvitation(any(CreateInvitationRequest.class));
        }

        @Test
        @DisplayName("should return 400 when email is missing")
        void should_Return400_When_EmailMissing() throws Exception {
            CreateInvitationRequest invalidRequest = new CreateInvitationRequest(
                null, UserRole.USER, null, null, null
            );

            mockMvc.perform(post("/api/v1/admin/invites")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

            verify(invitationService, never()).createInvitation(any());
        }

        @Test
        @DisplayName("should return 400 when email is invalid")
        void should_Return400_When_EmailInvalid() throws Exception {
            CreateInvitationRequest invalidRequest = new CreateInvitationRequest(
                "invalid-email", UserRole.USER, null, null, null
            );

            mockMvc.perform(post("/api/v1/admin/invites")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

            verify(invitationService, never()).createInvitation(any());
        }

        @Test
        @DisplayName("should return 400 when role is missing")
        void should_Return400_When_RoleMissing() throws Exception {
            CreateInvitationRequest invalidRequest = new CreateInvitationRequest(
                "test@test.com", null, null, null, null
            );

            mockMvc.perform(post("/api/v1/admin/invites")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

            verify(invitationService, never()).createInvitation(any());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/admin/invites")
    class ListInvitationsEndpoint {

        @Test
        @DisplayName("should return 200 with paginated invitations")
        void should_Return200_WithInvitations() throws Exception {
            Page<InvitationResponse> page = new PageImpl<>(
                List.of(testResponse), PageRequest.of(0, 20), 1
            );

            when(invitationService.listInvitations(any(), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/admin/invites")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email", is("invited@test.com")))
                .andExpect(jsonPath("$.totalElements", is(1)));

            verify(invitationService).listInvitations(any(), any());
        }

        @Test
        @DisplayName("should return 200 with empty page when no invitations")
        void should_Return200_WithEmptyPage() throws Exception {
            Page<InvitationResponse> emptyPage = new PageImpl<>(
                List.of(), PageRequest.of(0, 20), 0
            );

            when(invitationService.listInvitations(any(), any())).thenReturn(emptyPage);

            mockMvc.perform(get("/api/v1/admin/invites")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/admin/invites/{id}")
    class GetInvitationEndpoint {

        @Test
        @DisplayName("should return 200 when invitation exists")
        void should_Return200_When_InvitationExists() throws Exception {
            when(invitationService.getInvitation(1L)).thenReturn(testResponse);

            mockMvc.perform(get("/api/v1/admin/invites/1")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.email", is("invited@test.com")));

            verify(invitationService).getInvitation(1L);
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/admin/invites/{id}")
    class CancelInvitationEndpoint {

        @Test
        @DisplayName("should return 204 when invitation cancelled")
        void should_Return204_When_Cancelled() throws Exception {
            doNothing().when(invitationService).cancelInvitation(1L);

            mockMvc.perform(delete("/api/v1/admin/invites/1")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

            verify(invitationService).cancelInvitation(1L);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/admin/invites/{id}/resend")
    class ResendInvitationEndpoint {

        @Test
        @DisplayName("should return 200 when invitation resent")
        void should_Return200_When_Resent() throws Exception {
            when(invitationService.resendInvitation(1L)).thenReturn(testResponse);

            mockMvc.perform(post("/api/v1/admin/invites/1/resend")
                    .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.email", is("invited@test.com")));

            verify(invitationService).resendInvitation(1L);
        }
    }
}
