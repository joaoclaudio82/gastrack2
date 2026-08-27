package com.gastrack.service;

import com.gastrack.security.cognito.dto.*;

/**
 * Service interface for authentication operations.
 * Orchestrates authentication flows between AWS Cognito and local user database.
 */
public interface AuthenticationService {

    /**
     * Register a new user.
     * Creates user in Cognito and local database.
     *
     * @param request the signup request
     * @return the signup response
     * @throws com.gastrack.exceptions.UserAlreadyExistsException if user already exists
     */
    CognitoSignUpResponse registerUser(CognitoSignUpRequest request);

    /**
     * Confirm user registration with verification code.
     *
     * @param request the confirmation request
     * @return the confirmation response
     * @throws com.gastrack.exceptions.AuthenticationException if confirmation fails
     */
    CognitoConfirmResponse confirmRegistration(CognitoConfirmRequest request);

    /**
     * Authenticate user and return JWT tokens.
     * Updates last login timestamp after successful authentication.
     *
     * @param request the login request
     * @return the authentication response with tokens
     * @throws com.gastrack.exceptions.AuthenticationException if authentication fails
     */
    CognitoAuthResponse login(CognitoLoginRequest request);

    /**
     * Refresh access token using refresh token.
     *
     * @param request the refresh token request
     * @return the new authentication response
     * @throws com.gastrack.exceptions.AuthenticationException if refresh fails
     */
    CognitoAuthResponse refreshToken(CognitoRefreshRequest request);

    /**
     * Logout user from all devices.
     *
     * @param accessToken the user's access token
     */
    void logout(String accessToken);
}
