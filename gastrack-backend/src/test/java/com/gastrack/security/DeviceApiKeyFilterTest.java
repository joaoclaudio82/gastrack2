package com.gastrack.security;

import com.gastrack.configuration.DeviceProvisioningProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeviceApiKeyFilter Tests")
class DeviceApiKeyFilterTest {

    @Mock
    private DeviceProvisioningProperties provisioningProperties;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private DeviceApiKeyFilter filter;

    private static final String VALID_API_KEY = "test-api-key-123";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("should_SetAuthentication_When_ValidApiKey")
    void should_SetAuthentication_When_ValidApiKey() throws ServletException, IOException {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/devices/ESP32-001/provision");
        when(request.getHeader("X-Device-Api-Key")).thenReturn(VALID_API_KEY);
        when(provisioningProperties.getApiKey()).thenReturn(VALID_API_KEY);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_DEVICE");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_Return401_When_MissingApiKey")
    void should_Return401_When_MissingApiKey() throws ServletException, IOException {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/devices/ESP32-001/provision");
        when(request.getHeader("X-Device-Api-Key")).thenReturn(null);
        StringWriter stringWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(stringWriter));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("should_Return401_When_InvalidApiKey")
    void should_Return401_When_InvalidApiKey() throws ServletException, IOException {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/devices/ESP32-001/provision");
        when(request.getHeader("X-Device-Api-Key")).thenReturn("wrong-key");
        when(provisioningProperties.getApiKey()).thenReturn(VALID_API_KEY);
        StringWriter stringWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(stringWriter));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("should_SkipFilter_When_NotDeviceEndpoint")
    void should_SkipFilter_When_NotDeviceEndpoint() {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");

        // When
        boolean shouldNotFilter = filter.shouldNotFilter(request);

        // Then
        assertThat(shouldNotFilter).isTrue();
    }

    @Test
    @DisplayName("should_NotSkipFilter_When_DeviceEndpoint")
    void should_NotSkipFilter_When_DeviceEndpoint() {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/devices/ESP32-001/provision");

        // When
        boolean shouldNotFilter = filter.shouldNotFilter(request);

        // Then
        assertThat(shouldNotFilter).isFalse();
    }
}
