package com.gastrack.service;

import com.gastrack.security.cognito.dto.CognitoResetPasswordRequest;

/**
 * Service interface for password reset operations.
 * Handles password reset flows with AWS Cognito.
 */
public interface PasswordResetService {

    /**
     * Initiate password reset process.
     * Sends confirmation code to user's email.
     *
     * @param username the user's username (email)
     * @throws com.gastrack.exceptions.PasswordResetException if reset fails
     */
    void initiatePasswordReset(String username);

    /**
     * Confirm password reset with verification code.
     *
     * @param request the reset password request
     * @throws com.gastrack.exceptions.PasswordResetException if confirmation fails
     */
    void confirmPasswordReset(CognitoResetPasswordRequest request);

    /**
     * Resend confirmation code to user's email.
     *
     * @param username the user's username (email)
     * @throws com.gastrack.exceptions.PasswordResetException if resend fails
     */
    void resendConfirmationCode(String username);
}
