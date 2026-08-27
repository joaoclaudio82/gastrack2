package com.gastrack.security.cognito;

import com.gastrack.security.utils.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CognitoJwtAuthenticationFilter Tests")
class CognitoJwtAuthenticationFilterTest {

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private CognitoJwtAuthenticationFilter filter;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String BEARER_TOKEN = "Bearer " + VALID_TOKEN;
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("should_AuthenticateUser_When_ValidJwtTokenProvided")
    void should_AuthenticateUser_When_ValidJwtTokenProvided() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);
        claims.put("cognito:groups", Arrays.asList("users", "admins"));

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder).decode(VALID_TOKEN);
        verify(securityContext).setAuthentication(argThat(auth -> {
            // Principal is now the Jwt object, not the username string
            assertThat(auth.getPrincipal()).isInstanceOf(Jwt.class);
            Jwt principal = (Jwt) auth.getPrincipal();
            assertThat(principal.getClaimAsString("cognito:username")).isEqualTo(TEST_USERNAME);
            assertThat(auth.getAuthorities()).hasSize(2);
            assertThat(auth.getAuthorities()).extracting("authority")
                    .containsExactlyInAnyOrder("ROLE_USERS", "ROLE_ADMINS");
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ExtractUsernameFromCognitoUsername_When_ClaimPresent")
    void should_ExtractUsernameFromCognitoUsername_When_ClaimPresent() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getPrincipal()).isInstanceOf(Jwt.class);
            Jwt principal = (Jwt) auth.getPrincipal();
            assertThat(principal.getClaimAsString("cognito:username")).isEqualTo(TEST_USERNAME);
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ExtractUsernameFromEmail_When_CognitoUsernameNotPresent")
    void should_ExtractUsernameFromEmail_When_CognitoUsernameNotPresent() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", TEST_EMAIL);

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getPrincipal()).isInstanceOf(Jwt.class);
            Jwt principal = (Jwt) auth.getPrincipal();
            assertThat(principal.getClaimAsString("email")).isEqualTo(TEST_EMAIL);
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ExtractUsernameFromSubject_When_OtherClaimsNotPresent")
    void should_ExtractUsernameFromSubject_When_OtherClaimsNotPresent() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        Jwt jwt = createJwt(claims); // Will use subject

        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getPrincipal()).isInstanceOf(Jwt.class);
            Jwt principal = (Jwt) auth.getPrincipal();
            assertThat(principal.getSubject()).isEqualTo("test-subject");
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_AssignDefaultRole_When_NoGroupsInToken")
    void should_AssignDefaultRole_When_NoGroupsInToken() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getAuthorities()).hasSize(1);
            assertThat(auth.getAuthorities()).extracting("authority")
                    .containsExactly("ROLE_USER");
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ConvertGroupsToUppercaseRoles_When_GroupsProvided")
    void should_ConvertGroupsToUppercaseRoles_When_GroupsProvided() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);
        claims.put("cognito:groups", Arrays.asList("admin", "user", "manager"));

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getAuthorities()).hasSize(3);
            assertThat(auth.getAuthorities()).extracting("authority")
                    .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_USER", "ROLE_MANAGER");
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ContinueWithoutAuthentication_When_NoAuthorizationHeader")
    void should_ContinueWithoutAuthentication_When_NoAuthorizationHeader() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(null);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder, never()).decode(anyString());
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ContinueWithoutAuthentication_When_HeaderDoesNotStartWithBearer")
    void should_ContinueWithoutAuthentication_When_HeaderDoesNotStartWithBearer() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn("Basic " + VALID_TOKEN);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder, never()).decode(anyString());
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_NotSetAuthentication_When_SecurityContextAlreadyHasAuthentication")
    void should_NotSetAuthentication_When_SecurityContextAlreadyHasAuthentication() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);

        Authentication existingAuth = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(existingAuth);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder).decode(VALID_TOKEN);
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ContinueWithoutAuthentication_When_JwtDecodingFails")
    void should_ContinueWithoutAuthentication_When_JwtDecodingFails() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(jwtDecoder.decode(VALID_TOKEN)).thenThrow(new JwtException("Invalid token"));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder).decode(VALID_TOKEN);
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_HandleExpiredToken_When_JwtDecodingThrowsException")
    void should_HandleExpiredToken_When_JwtDecodingThrowsException() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(jwtDecoder.decode(VALID_TOKEN)).thenThrow(new JwtException("Token has expired"));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder).decode(VALID_TOKEN);
        verify(securityContext, never()).setAuthentication(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_StripBearerPrefix_When_ProcessingToken")
    void should_StripBearerPrefix_When_ProcessingToken() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn("Bearer    " + VALID_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(anyString())).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(jwtDecoder).decode(argThat(token -> !token.contains("Bearer")));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_SetAuthenticationDetails_When_ValidTokenProcessed")
    void should_SetAuthenticationDetails_When_ValidTokenProcessed() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("cognito:username", TEST_USERNAME);

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getDetails()).isNotNull();
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_ExtractUsernameFromUsernameClaim_When_Available")
    void should_ExtractUsernameFromUsernameClaim_When_Available() throws ServletException, IOException {
        // Given
        when(request.getHeader(SecurityConstants.HEADER_STRING)).thenReturn(BEARER_TOKEN);
        when(securityContext.getAuthentication()).thenReturn(null);

        Map<String, Object> claims = new HashMap<>();
        claims.put("username", "plainusername");

        Jwt jwt = createJwt(claims);
        when(jwtDecoder.decode(VALID_TOKEN)).thenReturn(jwt);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(securityContext).setAuthentication(argThat(auth -> {
            assertThat(auth.getPrincipal()).isInstanceOf(Jwt.class);
            Jwt principal = (Jwt) auth.getPrincipal();
            assertThat(principal.getClaimAsString("username")).isEqualTo("plainusername");
            return true;
        }));
        verify(filterChain).doFilter(request, response);
    }

    // Helper method to create JWT tokens for testing
    private Jwt createJwt(Map<String, Object> claims) {
        Map<String, Object> headers = new HashMap<>();
        headers.put("alg", "RS256");

        return new Jwt(
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                headers,
                claims.isEmpty() ? Map.of("sub", "test-subject") : claims
        );
    }
}
