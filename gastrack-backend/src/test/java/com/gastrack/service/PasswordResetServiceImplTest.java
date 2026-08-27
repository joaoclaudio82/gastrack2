package com.gastrack.service;

import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.CognitoResetPasswordRequest;
import com.gastrack.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordResetService Tests")
class PasswordResetServiceImplTest {

    @Mock
    private CognitoService cognitoService;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_CONFIRMATION_CODE = "123456";
    private static final String TEST_NEW_PASSWORD = "NewPassword123!";

    @Test
    @DisplayName("should_InitiatePasswordReset_When_UsernameProvided")
    void should_InitiatePasswordReset_When_UsernameProvided() {
        // Given
        doNothing().when(cognitoService).forgotPassword(TEST_USERNAME);

        // When
        passwordResetService.initiatePasswordReset(TEST_USERNAME);

        // Then
        verify(cognitoService).forgotPassword(TEST_USERNAME);
    }

    @Test
    @DisplayName("should_ConfirmPasswordReset_When_ValidRequestProvided")
    void should_ConfirmPasswordReset_When_ValidRequestProvided() {
        // Given
        CognitoResetPasswordRequest request = CognitoResetPasswordRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .newPassword(TEST_NEW_PASSWORD)
                .build();

        doNothing().when(cognitoService).confirmForgotPassword(request);

        // When
        passwordResetService.confirmPasswordReset(request);

        // Then
        verify(cognitoService).confirmForgotPassword(request);
    }

    @Test
    @DisplayName("should_ResendConfirmationCode_When_UsernameProvided")
    void should_ResendConfirmationCode_When_UsernameProvided() {
        // Given
        doNothing().when(cognitoService).resendConfirmationCode(TEST_USERNAME);

        // When
        passwordResetService.resendConfirmationCode(TEST_USERNAME);

        // Then
        verify(cognitoService).resendConfirmationCode(TEST_USERNAME);
    }
}
