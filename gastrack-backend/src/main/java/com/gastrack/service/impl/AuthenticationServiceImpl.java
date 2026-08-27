package com.gastrack.service.impl;

import com.gastrack.exceptions.AuthenticationException;
import com.gastrack.exceptions.UserAlreadyExistsException;
import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.*;
import com.gastrack.service.AuthenticationService;
import com.gastrack.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Implementation of AuthenticationService.
 * Orchestrates authentication operations between AWS Cognito and local user management.
 */
@Slf4j
@Service
@Profile("!dev")
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final CognitoService cognitoService;
    private final UserService userService;

    @Override
    public CognitoSignUpResponse registerUser(CognitoSignUpRequest request) {
        log.info("Registering new user: {}", request.getEmail());

        try {
            // Check if user already exists locally
            if (userService.existsByCognitoSub(request.getUsername())) {
                throw UserAlreadyExistsException.byEmail(request.getEmail());
            }

            // Register in Cognito
            CognitoSignUpResponse cognitoResponse = cognitoService.signUp(request);
            log.info("User registered in Cognito with sub: {}", cognitoResponse.getUserSub());

            // Create local user record
            // Note: We create the user immediately, but it will be inactive until confirmed
            userService.createUser(
                    cognitoResponse.getUserSub(),
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    request.getPhoneNumber()
            );

            log.info("User created successfully in local database: {}", request.getEmail());
            return cognitoResponse;

        } catch (UserAlreadyExistsException e) {
            log.error("User already exists: {}", request.getEmail());
            throw e;
        } catch (Exception e) {
            log.error("Error during user registration: {}", e.getMessage(), e);
            throw new AuthenticationException("Failed to register user: " + e.getMessage(), e);
        }
    }

    @Override
    public CognitoConfirmResponse confirmRegistration(CognitoConfirmRequest request) {
        log.info("Confirming registration for user: {}", request.getUsername());

        try {
            CognitoConfirmResponse response = cognitoService.confirmSignUp(request);
            log.info("User confirmed successfully: {}", request.getUsername());
            return response;

        } catch (Exception e) {
            log.error("Error confirming user registration: {}", e.getMessage(), e);
            throw new AuthenticationException("Failed to confirm registration: " + e.getMessage(), e);
        }
    }

    @Override
    public CognitoAuthResponse login(CognitoLoginRequest request) {
        log.info("User login attempt: {}", request.getUsername());

        try {
            // Authenticate with Cognito
            CognitoAuthResponse authResponse = cognitoService.login(request);
            log.info("User authenticated successfully: {}", request.getUsername());

            // TODO: Extract cognitoSub from JWT token and update last login
            // For now, we'll try to update by email
            // In production, you should decode the JWT token to get the 'sub' claim
            try {
                // This is a workaround - ideally decode JWT to get cognitoSub
                // For now, we'll skip the last login update or implement JWT decoding
                log.debug("Login successful, consider implementing JWT decoding for last login update");
            } catch (Exception e) {
                log.warn("Could not update last login: {}", e.getMessage());
                // Don't fail login if last login update fails
            }

            return authResponse;

        } catch (Exception e) {
            log.error("Authentication failed for user {}: {}", request.getUsername(), e.getMessage());
            throw new AuthenticationException("Authentication failed: " + e.getMessage(), e);
        }
    }

    @Override
    public CognitoAuthResponse refreshToken(CognitoRefreshRequest request) {
        log.info("Refreshing token for user: {}", request.getUsername());

        try {
            CognitoAuthResponse response = cognitoService.refreshToken(request);
            log.info("Token refreshed successfully for user: {}", request.getUsername());
            return response;

        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage(), e);
            throw new AuthenticationException("Failed to refresh token: " + e.getMessage(), e);
        }
    }

    @Override
    public void logout(String accessToken) {
        log.info("Logging out user");

        try {
            cognitoService.logout(accessToken);
            log.info("User logged out successfully");

        } catch (Exception e) {
            log.error("Error during logout: {}", e.getMessage(), e);
            throw new AuthenticationException("Failed to logout: " + e.getMessage(), e);
        }
    }
}
