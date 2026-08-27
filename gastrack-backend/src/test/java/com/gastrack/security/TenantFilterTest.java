package com.gastrack.security;

import com.gastrack.model.*;
import com.gastrack.repository.UserRepository;
import com.gastrack.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TenantFilter Tests")
class TenantFilterTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private TenantFilter tenantFilter;

    private Company testCompany;
    private User testUser;
    private UserInvitation testInvitation;
    private Jwt mockJwt;

    @BeforeEach
    void setUp() {
        lenient().when(request.getRequestURI()).thenReturn("/api/v1/users");

        testCompany = Company.builder()
            .id(1L)
            .name("Test Company")
            .slug("test-company")
            .active(true)
            .build();

        testUser = User.builder()
            .id(1L)
            .cognitoSub("existing-user-sub")
            .email("existing@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .active(true)
            .build();

        testInvitation = UserInvitation.builder()
            .id(1L)
            .email("newuser@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token(UUID.randomUUID().toString())
            .status(InvitationStatus.PENDING)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .build();

        // Create mock JWT
        mockJwt = Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .subject("new-user-sub")
            .claim("email", "newuser@test.com")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Nested
    @DisplayName("Existing User Flow")
    class ExistingUserFlowTests {

        @Test
        @DisplayName("should populate tenant context for existing user")
        void should_PopulateTenantContext_When_UserExists() throws Exception {
            // Given
            Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .subject("existing-user-sub")
                .claim("email", "existing@test.com")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                jwt, null, Collections.emptyList()
            );

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(auth);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByCognitoSub("existing-user-sub")).thenReturn(Optional.of(testUser));

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then
            verify(filterChain).doFilter(request, response);
            verify(userRepository).findByCognitoSub("existing-user-sub");
            verify(userService, never()).handleFirstLogin(any(), any());
        }

        @Test
        @DisplayName("should record login when JWT auth_time is newer than lastLoginAt")
        void should_RecordLogin_When_AuthTimeNewer() throws Exception {
            // Given - existing user with an older lastLoginAt and a JWT carrying auth_time
            testUser.setLastLoginAt(LocalDateTime.of(2026, 1, 1, 0, 0));
            Instant authTime = Instant.parse("2026-07-24T10:15:30Z");
            Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .subject("existing-user-sub")
                .claim("email", "existing@test.com")
                .claim("auth_time", authTime)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                jwt, null, Collections.emptyList()
            );
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(auth);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByCognitoSub("existing-user-sub")).thenReturn(Optional.of(testUser));

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then
            verify(userService).recordLogin("existing-user-sub", authTime);
        }

        @Test
        @DisplayName("should NOT record login in DEV when principal is a String (Basic Auth)")
        void should_NotRecordLogin_When_PrincipalIsString() throws Exception {
            // Given - DEV Basic Auth: principal is the sub String, no JWT claims
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "existing-user-sub", null, Collections.emptyList()
            );
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(auth);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByCognitoSub("existing-user-sub")).thenReturn(Optional.of(testUser));

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then - no auth_time available -> recordLogin never called, dev stays intact
            verify(filterChain).doFilter(request, response);
            verify(userService, never()).recordLogin(any(), any());
        }
    }

    @Nested
    @DisplayName("First Login Flow")
    class FirstLoginFlowTests {

        @Test
        @DisplayName("should create user from invitation on first login")
        void should_CreateUser_When_FirstLoginWithInvitation() throws Exception {
            // Given
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                mockJwt, null, Collections.emptyList()
            );

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(auth);
            SecurityContextHolder.setContext(securityContext);

            User createdUser = User.builder()
                .id(2L)
                .cognitoSub("new-user-sub")
                .email("newuser@test.com")
                .role(UserRole.USER)
                .company(testCompany)
                .active(true)
                .build();

            when(userRepository.findByCognitoSub("new-user-sub")).thenReturn(Optional.empty());
            when(userService.handleFirstLogin("new-user-sub", "newuser@test.com")).thenReturn(Optional.of(createdUser));

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then
            verify(filterChain).doFilter(request, response);
            verify(userService).handleFirstLogin("new-user-sub", "newuser@test.com");
        }

        @Test
        @DisplayName("should not create user when no pending invitation found")
        void should_NotCreateUser_When_NoInvitation() throws Exception {
            // Given
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                mockJwt, null, Collections.emptyList()
            );

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(auth);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByCognitoSub("new-user-sub")).thenReturn(Optional.empty());
            when(userService.handleFirstLogin("new-user-sub", "newuser@test.com")).thenReturn(Optional.empty());

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then
            verify(filterChain).doFilter(request, response);
            verify(userService).handleFirstLogin("new-user-sub", "newuser@test.com");
        }

        @Test
        @DisplayName("should not create user when invitation is expired")
        void should_NotCreateUser_When_InvitationExpired() throws Exception {
            // Given
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                mockJwt, null, Collections.emptyList()
            );

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(auth);
            SecurityContextHolder.setContext(securityContext);

            when(userRepository.findByCognitoSub("new-user-sub")).thenReturn(Optional.empty());
            // UserService.handleFirstLogin returns empty when invitation is expired
            when(userService.handleFirstLogin("new-user-sub", "newuser@test.com")).thenReturn(Optional.empty());

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then
            verify(filterChain).doFilter(request, response);
            verify(userService).handleFirstLogin("new-user-sub", "newuser@test.com");
        }
    }

    @Nested
    @DisplayName("No Authentication Flow")
    class NoAuthenticationFlowTests {

        @Test
        @DisplayName("should proceed without populating context when no authentication")
        void should_ProceedWithoutContext_When_NoAuthentication() throws Exception {
            // Given - no authentication in security context
            SecurityContextHolder.clearContext();

            // When
            tenantFilter.doFilter(request, response, filterChain);

            // Then
            verify(filterChain).doFilter(request, response);
            verify(userRepository, never()).findByCognitoSub(any());
            verify(userService, never()).handleFirstLogin(any(), any());
        }
    }
}
