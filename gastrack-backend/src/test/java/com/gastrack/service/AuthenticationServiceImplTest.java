package com.gastrack.service;

import com.gastrack.model.User;
import com.gastrack.model.UserRole;
import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.CognitoAuthResponse;
import com.gastrack.security.cognito.dto.CognitoLoginRequest;
import com.gastrack.security.cognito.dto.CognitoSignUpRequest;
import com.gastrack.security.cognito.dto.CognitoSignUpResponse;
import com.gastrack.service.impl.AuthenticationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationService Tests")
class AuthenticationServiceImplTest {

    @Mock
    private CognitoService cognitoService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    private CognitoSignUpRequest signUpRequest;
    private CognitoLoginRequest loginRequest;
    private CognitoSignUpResponse signUpResponse;
    private CognitoAuthResponse authResponse;
    private User testUser;

    private static final String TEST_COGNITO_SUB = "test-cognito-sub-123";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_PASSWORD = "TestPassword123!";
    private static final String TEST_ACCESS_TOKEN = "test-access-token";

    @BeforeEach
    void setUp() {
        signUpRequest = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName("Test")
                .lastName("User")
                .build();

        loginRequest = CognitoLoginRequest.builder()
                .username(TEST_USERNAME)
                .password(TEST_PASSWORD)
                .build();

        signUpResponse = CognitoSignUpResponse.builder()
                .userSub(TEST_COGNITO_SUB)
                .userConfirmed(false)
                .message("User registered successfully")
                .build();

        authResponse = CognitoAuthResponse.builder()
                .accessToken(TEST_ACCESS_TOKEN)
                .idToken("test-id-token")
                .refreshToken("test-refresh-token")
                .expiresIn(3600)
                .tokenType("Bearer")
                .build();

        testUser = User.builder()
                .id(1L)
                .cognitoSub(TEST_COGNITO_SUB)
                .email(TEST_EMAIL)
                .username(TEST_USERNAME)
                .firstName("Test")
                .lastName("User")
                .active(true)
                .role(UserRole.USER)
                .build();
    }

    @Test
    @DisplayName("should_RegisterUser_When_ValidRequestProvided")
    void should_RegisterUser_When_ValidRequestProvided() {
        // Given
        when(cognitoService.signUp(signUpRequest)).thenReturn(signUpResponse);
        when(userService.createUser(
                eq(TEST_COGNITO_SUB),
                eq(TEST_EMAIL),
                eq("Test"),
                eq("User"),
                any()
        )).thenReturn(testUser);

        // When
        CognitoSignUpResponse result = authenticationService.registerUser(signUpRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUserSub()).isEqualTo(TEST_COGNITO_SUB);
        verify(cognitoService).signUp(signUpRequest);
        verify(userService).createUser(
                eq(TEST_COGNITO_SUB),
                eq(TEST_EMAIL),
                eq("Test"),
                eq("User"),
                any()
        );
    }

    @Test
    @DisplayName("should_LoginUser_When_ValidCredentialsProvided")
    void should_LoginUser_When_ValidCredentialsProvided() {
        // Given
        when(cognitoService.login(loginRequest)).thenReturn(authResponse);

        // When
        CognitoAuthResponse result = authenticationService.login(loginRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo(TEST_ACCESS_TOKEN);
        verify(cognitoService).login(loginRequest);
    }

    @Test
    @DisplayName("should_LogoutUser_When_ValidTokenProvided")
    void should_LogoutUser_When_ValidTokenProvided() {
        // Given
        doNothing().when(cognitoService).logout(TEST_ACCESS_TOKEN);

        // When
        authenticationService.logout(TEST_ACCESS_TOKEN);

        // Then
        verify(cognitoService).logout(TEST_ACCESS_TOKEN);
    }
}
