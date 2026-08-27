package com.gastrack.security.cognito;

import com.gastrack.controller.CognitoAuthController;
import com.gastrack.security.cognito.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CognitoAuthController Tests")
class CognitoAuthControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private CognitoService cognitoService;

    @InjectMocks
    private CognitoAuthController cognitoAuthController;

    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "TestPassword123!";
    private static final String TEST_FIRST_NAME = "Test";
    private static final String TEST_LAST_NAME = "User";
    private static final String TEST_ACCESS_TOKEN = "test-access-token";
    private static final String TEST_ID_TOKEN = "test-id-token";
    private static final String TEST_REFRESH_TOKEN = "test-refresh-token";
    private static final String TEST_CONFIRMATION_CODE = "123456";
    private static final String TEST_USER_SUB = "test-user-sub-123";

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(cognitoAuthController).build();
    }

    @Test
    @DisplayName("should_Return200AndSignUpResponse_When_ValidSignUpRequest")
    void should_Return200AndSignUpResponse_When_ValidSignUpRequest() throws Exception {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        CognitoSignUpResponse expectedResponse = CognitoSignUpResponse.builder()
                .userSub(TEST_USER_SUB)
                .userConfirmed(false)
                .message("User registered successfully")
                .build();

        when(cognitoService.signUp(any(CognitoSignUpRequest.class))).thenReturn(expectedResponse);

        // When/Then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userSub", is(TEST_USER_SUB)))
                .andExpect(jsonPath("$.userConfirmed", is(false)))
                .andExpect(jsonPath("$.message", containsString("registered successfully")));

        verify(cognitoService).signUp(any(CognitoSignUpRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_SignUpRequestMissingUsername")
    void should_Return400_When_SignUpRequestMissingUsername() throws Exception {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).signUp(any(CognitoSignUpRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_SignUpRequestInvalidEmail")
    void should_Return400_When_SignUpRequestInvalidEmail() throws Exception {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .email("invalid-email")
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).signUp(any(CognitoSignUpRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_SignUpRequestPasswordTooShort")
    void should_Return400_When_SignUpRequestPasswordTooShort() throws Exception {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .email(TEST_EMAIL)
                .password("short")
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).signUp(any(CognitoSignUpRequest.class));
    }

    @Test
    @DisplayName("should_Return200AndConfirmResponse_When_ValidConfirmRequest")
    void should_Return200AndConfirmResponse_When_ValidConfirmRequest() throws Exception {
        // Given
        CognitoConfirmRequest request = CognitoConfirmRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .build();

        CognitoConfirmResponse expectedResponse = CognitoConfirmResponse.builder()
                .confirmed(true)
                .message("Account confirmed successfully")
                .build();

        when(cognitoService.confirmSignUp(any(CognitoConfirmRequest.class))).thenReturn(expectedResponse);

        // When/Then
        mockMvc.perform(post("/api/v1/auth/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmed", is(true)))
                .andExpect(jsonPath("$.message", containsString("confirmed successfully")));

        verify(cognitoService).confirmSignUp(any(CognitoConfirmRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_ConfirmRequestMissingConfirmationCode")
    void should_Return400_When_ConfirmRequestMissingConfirmationCode() throws Exception {
        // Given
        CognitoConfirmRequest request = CognitoConfirmRequest.builder()
                .username(TEST_USERNAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).confirmSignUp(any(CognitoConfirmRequest.class));
    }

    @Test
    @DisplayName("should_Return200AndAuthResponse_When_ValidLoginRequest")
    void should_Return200AndAuthResponse_When_ValidLoginRequest() throws Exception {
        // Given
        CognitoLoginRequest request = CognitoLoginRequest.builder()
                .username(TEST_USERNAME)
                .password(TEST_PASSWORD)
                .build();

        CognitoAuthResponse expectedResponse = CognitoAuthResponse.builder()
                .accessToken(TEST_ACCESS_TOKEN)
                .idToken(TEST_ID_TOKEN)
                .refreshToken(TEST_REFRESH_TOKEN)
                .expiresIn(3600)
                .tokenType("Bearer")
                .build();

        when(cognitoService.login(any(CognitoLoginRequest.class))).thenReturn(expectedResponse);

        // When/Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", is(TEST_ACCESS_TOKEN)))
                .andExpect(jsonPath("$.idToken", is(TEST_ID_TOKEN)))
                .andExpect(jsonPath("$.refreshToken", is(TEST_REFRESH_TOKEN)))
                .andExpect(jsonPath("$.expiresIn", is(3600)))
                .andExpect(jsonPath("$.tokenType", is("Bearer")));

        verify(cognitoService).login(any(CognitoLoginRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_LoginRequestMissingPassword")
    void should_Return400_When_LoginRequestMissingPassword() throws Exception {
        // Given
        CognitoLoginRequest request = CognitoLoginRequest.builder()
                .username(TEST_USERNAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).login(any(CognitoLoginRequest.class));
    }

    @Test
    @DisplayName("should_Return200AndAuthResponse_When_ValidRefreshTokenRequest")
    void should_Return200AndAuthResponse_When_ValidRefreshTokenRequest() throws Exception {
        // Given
        CognitoRefreshRequest request = CognitoRefreshRequest.builder()
                .username(TEST_USERNAME)
                .refreshToken(TEST_REFRESH_TOKEN)
                .build();

        CognitoAuthResponse expectedResponse = CognitoAuthResponse.builder()
                .accessToken("new-access-token")
                .idToken("new-id-token")
                .refreshToken(TEST_REFRESH_TOKEN)
                .expiresIn(3600)
                .tokenType("Bearer")
                .build();

        when(cognitoService.refreshToken(any(CognitoRefreshRequest.class))).thenReturn(expectedResponse);

        // When/Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", is("new-access-token")))
                .andExpect(jsonPath("$.idToken", is("new-id-token")))
                .andExpect(jsonPath("$.refreshToken", is(TEST_REFRESH_TOKEN)));

        verify(cognitoService).refreshToken(any(CognitoRefreshRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_RefreshTokenRequestMissingRefreshToken")
    void should_Return400_When_RefreshTokenRequestMissingRefreshToken() throws Exception {
        // Given
        CognitoRefreshRequest request = CognitoRefreshRequest.builder()
                .username(TEST_USERNAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).refreshToken(any(CognitoRefreshRequest.class));
    }

    @Test
    @DisplayName("should_Return200AndSuccessMessage_When_ValidForgotPasswordRequest")
    void should_Return200AndSuccessMessage_When_ValidForgotPasswordRequest() throws Exception {
        // Given
        doNothing().when(cognitoService).forgotPassword(eq(TEST_USERNAME));

        // When/Then
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .param("username", TEST_USERNAME))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password reset code sent")));

        verify(cognitoService).forgotPassword(eq(TEST_USERNAME));
    }

    @Test
    @DisplayName("should_Return200AndSuccessMessage_When_ValidResetPasswordRequest")
    void should_Return200AndSuccessMessage_When_ValidResetPasswordRequest() throws Exception {
        // Given
        CognitoResetPasswordRequest request = CognitoResetPasswordRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .newPassword("NewPassword123!")
                .build();

        doNothing().when(cognitoService).confirmForgotPassword(any(CognitoResetPasswordRequest.class));

        // When/Then
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password reset successfully")));

        verify(cognitoService).confirmForgotPassword(any(CognitoResetPasswordRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_ResetPasswordRequestMissingConfirmationCode")
    void should_Return400_When_ResetPasswordRequestMissingConfirmationCode() throws Exception {
        // Given
        CognitoResetPasswordRequest request = CognitoResetPasswordRequest.builder()
                .username(TEST_USERNAME)
                .newPassword("NewPassword123!")
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).confirmForgotPassword(any(CognitoResetPasswordRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_ResetPasswordRequestNewPasswordTooShort")
    void should_Return400_When_ResetPasswordRequestNewPasswordTooShort() throws Exception {
        // Given
        CognitoResetPasswordRequest request = CognitoResetPasswordRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .newPassword("short")
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).confirmForgotPassword(any(CognitoResetPasswordRequest.class));
    }

    @Test
    @DisplayName("should_Return200AndSuccessMessage_When_ValidLogoutRequest")
    void should_Return200AndSuccessMessage_When_ValidLogoutRequest() throws Exception {
        // Given
        doNothing().when(cognitoService).logout(eq(TEST_ACCESS_TOKEN));

        // When/Then
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + TEST_ACCESS_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Logged out successfully")));

        verify(cognitoService).logout(eq(TEST_ACCESS_TOKEN));
    }

    @Test
    @DisplayName("should_Return200AndSuccessMessage_When_ValidResendCodeRequest")
    void should_Return200AndSuccessMessage_When_ValidResendCodeRequest() throws Exception {
        // Given
        doNothing().when(cognitoService).resendConfirmationCode(eq(TEST_USERNAME));

        // When/Then
        mockMvc.perform(post("/api/v1/auth/resend-code")
                        .param("username", TEST_USERNAME))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Confirmation code resent")));

        verify(cognitoService).resendConfirmationCode(eq(TEST_USERNAME));
    }

    @Test
    @DisplayName("should_Return400_When_SignUpRequestUsernameExceedsMaxLength")
    void should_Return400_When_SignUpRequestUsernameExceedsMaxLength() throws Exception {
        // Given
        String longUsername = "a".repeat(51); // Exceeds max length of 50
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username(longUsername)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).signUp(any(CognitoSignUpRequest.class));
    }

    @Test
    @DisplayName("should_Return400_When_SignUpRequestUsernameBelowMinLength")
    void should_Return400_When_SignUpRequestUsernameBelowMinLength() throws Exception {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username("ab") // Below min length of 3
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        // When/Then
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(cognitoService, never()).signUp(any(CognitoSignUpRequest.class));
    }
}
