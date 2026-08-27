package com.gastrack.service.impl;

import com.gastrack.exceptions.PasswordResetException;
import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.CognitoResetPasswordRequest;
import com.gastrack.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Implementation of PasswordResetService.
 * Handles password reset operations through AWS Cognito.
 */
@Slf4j
@Service
@Profile("!dev")
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final CognitoService cognitoService;

    @Override
    public void initiatePasswordReset(String username) {
        log.info("Initiating password reset for user: {}", username);

        try {
            cognitoService.forgotPassword(username);
            log.info("Password reset code sent to user: {}", username);

        } catch (Exception e) {
            log.error("Error initiating password reset for user {}: {}", username, e.getMessage(), e);
            throw new PasswordResetException("Failed to initiate password reset: " + e.getMessage(), e);
        }
    }

    @Override
    public void confirmPasswordReset(CognitoResetPasswordRequest request) {
        log.info("Confirming password reset for user: {}", request.getUsername());

        try {
            cognitoService.confirmForgotPassword(request);
            log.info("Password reset successfully for user: {}", request.getUsername());

        } catch (Exception e) {
            log.error("Error confirming password reset for user {}: {}", request.getUsername(), e.getMessage(), e);

            // Check for specific error cases
            if (e.getMessage().contains("Invalid verification code") || e.getMessage().contains("expired")) {
                throw PasswordResetException.invalidCode();
            } else if (e.getMessage().contains("attempt limit exceeded")) {
                throw PasswordResetException.tooManyAttempts();
            } else {
                throw new PasswordResetException("Failed to reset password: " + e.getMessage(), e);
            }
        }
    }

    @Override
    public void resendConfirmationCode(String username) {
        log.info("Resending confirmation code for user: {}", username);

        try {
            cognitoService.resendConfirmationCode(username);
            log.info("Confirmation code resent to user: {}", username);

        } catch (Exception e) {
            log.error("Error resending confirmation code for user {}: {}", username, e.getMessage(), e);
            throw new PasswordResetException("Failed to resend confirmation code: " + e.getMessage(), e);
        }
    }
}
