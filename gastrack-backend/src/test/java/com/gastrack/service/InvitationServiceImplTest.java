package com.gastrack.service;

import com.gastrack.dto.invitation.CreateInvitationRequest;
import com.gastrack.dto.invitation.InvitationResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.InvitationMapper;
import com.gastrack.model.*;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.UserInvitationRepository;
import com.gastrack.repository.UserRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.CognitoAdminCreateUserRequest;
import com.gastrack.security.cognito.dto.CognitoAdminCreateUserResponse;
import com.gastrack.service.impl.InvitationServiceImpl;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvitationService Tests")
class InvitationServiceImplTest {

    @Mock
    private UserInvitationRepository invitationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CognitoService cognitoService;

    @Mock
    private InvitationMapper invitationMapper;

    @InjectMocks
    private InvitationServiceImpl invitationService;

    private Company testCompany;
    private User testAdmin;
    private User testSuperAdmin;
    private UserInvitation testInvitation;
    private InvitationResponse testResponse;
    private CreateInvitationRequest testRequest;

    @BeforeEach
    void setUp() {
        testCompany = Company.builder()
            .id(1L)
            .name("Test Company")
            .slug("test-company")
            .active(true)
            .build();

        testAdmin = User.builder()
            .id(1L)
            .cognitoSub("admin-sub")
            .email("admin@test.com")
            .role(UserRole.ADMIN)
            .company(testCompany)
            .active(true)
            .build();

        testSuperAdmin = User.builder()
            .id(2L)
            .cognitoSub("superadmin-sub")
            .email("superadmin@test.com")
            .role(UserRole.SUPER_ADMIN)
            .active(true)
            .build();

        testInvitation = UserInvitation.builder()
            .id(1L)
            .email("invited@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token("test-token")
            .status(InvitationStatus.PENDING)
            .cognitoUsername("invited@test.com")
            .expiresAt(LocalDateTime.now().plusDays(7))
            .createdBy(testAdmin)
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
    @DisplayName("createInvitation")
    class CreateInvitationTests {

        @Test
        @DisplayName("should create invitation when admin invites user to own company")
        void should_CreateInvitation_When_AdminInvitesUser() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                // Setup tenant context for ADMIN
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(false);
                tenantContext.when(TenantContext::getCurrentUserSub).thenReturn("admin-sub");
                tenantContext.when(TenantContext::getCurrentCompanyId).thenReturn(1L);
                tenantContext.when(TenantContext::getCurrentUserRole).thenReturn(UserRole.ADMIN);

                when(userRepository.findByCognitoSub("admin-sub")).thenReturn(Optional.of(testAdmin));
                when(userRepository.existsByEmail("invited@test.com")).thenReturn(false);
                when(invitationRepository.existsPendingByEmail("invited@test.com")).thenReturn(false);
                when(cognitoService.adminCreateUser(any(CognitoAdminCreateUserRequest.class)))
                    .thenReturn(CognitoAdminCreateUserResponse.builder()
                        .username("invited@test.com")
                        .userSub("new-user-sub")
                        .emailSent(true)
                        .build());
                when(invitationRepository.save(any(UserInvitation.class))).thenReturn(testInvitation);
                when(invitationMapper.toResponse(testInvitation)).thenReturn(testResponse);

                InvitationResponse result = invitationService.createInvitation(testRequest);

                assertThat(result).isNotNull();
                assertThat(result.email()).isEqualTo("invited@test.com");
                verify(cognitoService).adminCreateUser(any(CognitoAdminCreateUserRequest.class));
                verify(invitationRepository).save(any(UserInvitation.class));

                // Local User is provisioned immediately with the Cognito sub,
                // invited role and target company (bugs #35/#36).
                ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
                verify(userRepository).save(userCaptor.capture());
                User provisioned = userCaptor.getValue();
                assertThat(provisioned.getCognitoSub()).isEqualTo("new-user-sub");
                assertThat(provisioned.getEmail()).isEqualTo("invited@test.com");
                assertThat(provisioned.getRole()).isEqualTo(UserRole.USER);
                assertThat(provisioned.getCompany()).isEqualTo(testCompany);
            }
        }

        @Test
        @DisplayName("should not duplicate local user when sub already provisioned")
        void should_NotProvisionUser_When_UserAlreadyExists() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(false);
                tenantContext.when(TenantContext::getCurrentUserSub).thenReturn("admin-sub");
                tenantContext.when(TenantContext::getCurrentCompanyId).thenReturn(1L);
                tenantContext.when(TenantContext::getCurrentUserRole).thenReturn(UserRole.ADMIN);

                when(userRepository.findByCognitoSub("admin-sub")).thenReturn(Optional.of(testAdmin));
                when(userRepository.existsByEmail("invited@test.com")).thenReturn(false);
                when(invitationRepository.existsPendingByEmail("invited@test.com")).thenReturn(false);
                when(cognitoService.adminCreateUser(any(CognitoAdminCreateUserRequest.class)))
                    .thenReturn(CognitoAdminCreateUserResponse.builder()
                        .username("invited@test.com")
                        .userSub("new-user-sub")
                        .emailSent(true)
                        .build());
                when(userRepository.existsByCognitoSub("new-user-sub")).thenReturn(true);
                when(invitationRepository.save(any(UserInvitation.class))).thenReturn(testInvitation);
                when(invitationMapper.toResponse(testInvitation)).thenReturn(testResponse);

                invitationService.createInvitation(testRequest);

                verify(userRepository, never()).save(any(User.class));
            }
        }

        @Test
        @DisplayName("should create invitation when super admin invites to any company")
        void should_CreateInvitation_When_SuperAdminInvites() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);
                tenantContext.when(TenantContext::getCurrentUserSub).thenReturn("superadmin-sub");
                tenantContext.when(TenantContext::getCurrentUserRole).thenReturn(UserRole.SUPER_ADMIN);

                CreateInvitationRequest requestWithCompany = new CreateInvitationRequest(
                    "invited@test.com", UserRole.ADMIN, 1L, "John", "Doe"
                );

                when(userRepository.findByCognitoSub("superadmin-sub")).thenReturn(Optional.of(testSuperAdmin));
                when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
                when(userRepository.existsByEmail("invited@test.com")).thenReturn(false);
                when(invitationRepository.existsPendingByEmail("invited@test.com")).thenReturn(false);
                when(cognitoService.adminCreateUser(any(CognitoAdminCreateUserRequest.class)))
                    .thenReturn(CognitoAdminCreateUserResponse.builder()
                        .username("invited@test.com")
                        .userSub("new-user-sub")
                        .emailSent(true)
                        .build());
                when(invitationRepository.save(any(UserInvitation.class))).thenReturn(testInvitation);
                when(invitationMapper.toResponse(testInvitation)).thenReturn(testResponse);

                InvitationResponse result = invitationService.createInvitation(requestWithCompany);

                assertThat(result).isNotNull();
                verify(companyRepository).findById(1L);
            }
        }

        @Test
        @DisplayName("should throw exception when inviting SUPER_ADMIN role")
        void should_ThrowException_When_InvitingSuperAdmin() {
            CreateInvitationRequest superAdminRequest = new CreateInvitationRequest(
                "invited@test.com", UserRole.SUPER_ADMIN, 1L, null, null
            );

            assertThatThrownBy(() -> invitationService.createInvitation(superAdminRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("SUPER_ADMIN");
        }

        @Test
        @DisplayName("should throw exception when user already exists")
        void should_ThrowException_When_UserAlreadyExists() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(false);
                tenantContext.when(TenantContext::getCurrentUserSub).thenReturn("admin-sub");
                tenantContext.when(TenantContext::getCurrentUserRole).thenReturn(UserRole.ADMIN);

                when(userRepository.findByCognitoSub("admin-sub")).thenReturn(Optional.of(testAdmin));
                when(userRepository.existsByEmail("invited@test.com")).thenReturn(true);

                assertThatThrownBy(() -> invitationService.createInvitation(testRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already exists");
            }
        }

        @Test
        @DisplayName("should throw exception when pending invitation exists")
        void should_ThrowException_When_PendingInvitationExists() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(false);
                tenantContext.when(TenantContext::getCurrentUserSub).thenReturn("admin-sub");
                tenantContext.when(TenantContext::getCurrentUserRole).thenReturn(UserRole.ADMIN);

                when(userRepository.findByCognitoSub("admin-sub")).thenReturn(Optional.of(testAdmin));
                when(userRepository.existsByEmail("invited@test.com")).thenReturn(false);
                when(invitationRepository.existsPendingByEmail("invited@test.com")).thenReturn(true);

                assertThatThrownBy(() -> invitationService.createInvitation(testRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("pending invitation");
            }
        }

        @Test
        @DisplayName("should throw exception when super admin doesn't specify company")
        void should_ThrowException_When_SuperAdminNoCompany() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);
                tenantContext.when(TenantContext::getCurrentUserSub).thenReturn("superadmin-sub");

                when(userRepository.findByCognitoSub("superadmin-sub")).thenReturn(Optional.of(testSuperAdmin));

                assertThatThrownBy(() -> invitationService.createInvitation(testRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Company ID is required");
            }
        }
    }

    @Nested
    @DisplayName("listInvitations")
    class ListInvitationsTests {

        @Test
        @DisplayName("should list all invitations for super admin")
        void should_ListAll_When_SuperAdmin() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);

                Pageable pageable = PageRequest.of(0, 10);
                Page<UserInvitation> invitationPage = new PageImpl<>(List.of(testInvitation));

                when(invitationRepository.findAll(pageable)).thenReturn(invitationPage);
                when(invitationMapper.toResponse(testInvitation)).thenReturn(testResponse);

                Page<InvitationResponse> result = invitationService.listInvitations(pageable, null);

                assertThat(result.getContent()).hasSize(1);
                verify(invitationRepository).findAll(pageable);
            }
        }

        @Test
        @DisplayName("should list company invitations for admin")
        void should_ListCompanyOnly_When_Admin() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(false);
                tenantContext.when(TenantContext::getCurrentCompanyId).thenReturn(1L);

                Pageable pageable = PageRequest.of(0, 10);
                Page<UserInvitation> invitationPage = new PageImpl<>(List.of(testInvitation));

                when(invitationRepository.findByCompanyId(1L, pageable)).thenReturn(invitationPage);
                when(invitationMapper.toResponse(testInvitation)).thenReturn(testResponse);

                Page<InvitationResponse> result = invitationService.listInvitations(pageable, null);

                assertThat(result.getContent()).hasSize(1);
                verify(invitationRepository).findByCompanyId(1L, pageable);
            }
        }
    }

    @Nested
    @DisplayName("cancelInvitation")
    class CancelInvitationTests {

        @Test
        @DisplayName("should cancel pending invitation")
        void should_CancelInvitation_When_Pending() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);

                when(invitationRepository.findById(1L)).thenReturn(Optional.of(testInvitation));

                invitationService.cancelInvitation(1L);

                assertThat(testInvitation.getStatus()).isEqualTo(InvitationStatus.CANCELLED);
                verify(cognitoService).adminDeleteUser("invited@test.com");
                verify(invitationRepository).save(testInvitation);
            }
        }

        @Test
        @DisplayName("should throw exception when invitation not pending")
        void should_ThrowException_When_NotPending() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);

                testInvitation.setStatus(InvitationStatus.ACCEPTED);
                when(invitationRepository.findById(1L)).thenReturn(Optional.of(testInvitation));

                assertThatThrownBy(() -> invitationService.cancelInvitation(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("pending");
            }
        }

        @Test
        @DisplayName("should throw exception when invitation not found")
        void should_ThrowException_When_NotFound() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);

                when(invitationRepository.findById(999L)).thenReturn(Optional.empty());

                assertThatThrownBy(() -> invitationService.cancelInvitation(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
            }
        }
    }

    @Nested
    @DisplayName("resendInvitation")
    class ResendInvitationTests {

        @Test
        @DisplayName("should resend invitation and update expiration")
        void should_ResendInvitation_When_Valid() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);

                LocalDateTime originalExpiry = testInvitation.getExpiresAt();
                when(invitationRepository.findById(1L)).thenReturn(Optional.of(testInvitation));
                when(invitationRepository.save(any(UserInvitation.class))).thenReturn(testInvitation);
                when(invitationMapper.toResponse(testInvitation)).thenReturn(testResponse);

                InvitationResponse result = invitationService.resendInvitation(1L);

                assertThat(result).isNotNull();
                verify(cognitoService).adminResendInvitation("invited@test.com");
                assertThat(testInvitation.getExpiresAt()).isAfter(originalExpiry);
            }
        }

        @Test
        @DisplayName("should throw exception when invitation not pending")
        void should_ThrowException_When_NotPending() {
            try (MockedStatic<TenantContext> tenantContext = mockStatic(TenantContext.class)) {
                tenantContext.when(TenantContext::isSuperAdmin).thenReturn(true);

                testInvitation.setStatus(InvitationStatus.CANCELLED);
                when(invitationRepository.findById(1L)).thenReturn(Optional.of(testInvitation));

                assertThatThrownBy(() -> invitationService.resendInvitation(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("pending");
            }
        }
    }

    @Nested
    @DisplayName("findPendingInvitationByEmail")
    class FindPendingInvitationTests {

        @Test
        @DisplayName("should find pending invitation by email")
        void should_FindPendingInvitation_When_Exists() {
            when(invitationRepository.findPendingByEmail("invited@test.com"))
                .thenReturn(Optional.of(testInvitation));

            Optional<UserInvitation> result = invitationService.findPendingInvitationByEmail("invited@test.com");

            assertThat(result).isPresent();
            assertThat(result.get().getEmail()).isEqualTo("invited@test.com");
        }

        @Test
        @DisplayName("should return empty when no pending invitation")
        void should_ReturnEmpty_When_NoPendingInvitation() {
            when(invitationRepository.findPendingByEmail("nonexistent@test.com"))
                .thenReturn(Optional.empty());

            Optional<UserInvitation> result = invitationService.findPendingInvitationByEmail("nonexistent@test.com");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("markAsAccepted")
    class MarkAsAcceptedTests {

        @Test
        @DisplayName("should mark invitation as accepted")
        void should_MarkAsAccepted() {
            invitationService.markAsAccepted(testInvitation);

            assertThat(testInvitation.getStatus()).isEqualTo(InvitationStatus.ACCEPTED);
            verify(invitationRepository).save(testInvitation);
        }
    }
}
