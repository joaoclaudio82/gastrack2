package com.gastrack.controller;

import com.gastrack.model.User;
import com.gastrack.repository.UserRepository;
import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication API v1", description = "Endpoints for user authentication with AWS Cognito")
public class CognitoAuthController {

    private final CognitoService cognitoService;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    @Operation(summary = "Register a new user", description = "Creates a new user account in AWS Cognito")
    public ResponseEntity<CognitoSignUpResponse> signUp(@Valid @RequestBody CognitoSignUpRequest request) {
        CognitoSignUpResponse response = cognitoService.signUp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm user registration", description = "Confirms user account with the verification code sent to email")
    public ResponseEntity<CognitoConfirmResponse> confirmSignUp(@Valid @RequestBody CognitoConfirmRequest request) {
        CognitoConfirmResponse response = cognitoService.confirmSignUp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user and returns JWT tokens. May return a challenge (e.g., NEW_PASSWORD_REQUIRED) requiring a call to /respond-challenge")
    public ResponseEntity<CognitoAuthResponse> login(@Valid @RequestBody CognitoLoginRequest request) {
        CognitoAuthResponse response = cognitoService.login(request);
        enrichWithUserProfile(response, request.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/respond-challenge")
    @Operation(summary = "Respond to authentication challenge", description = "Completes authentication when a challenge is required (e.g., setting new password on first login)")
    public ResponseEntity<CognitoAuthResponse> respondToChallenge(@Valid @RequestBody CognitoRespondChallengeRequest request) {
        CognitoAuthResponse response = cognitoService.respondToChallenge(request);
        enrichWithUserProfile(response, request.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Generates new access token using refresh token")
    public ResponseEntity<CognitoAuthResponse> refreshToken(@Valid @RequestBody CognitoRefreshRequest request) {
        CognitoAuthResponse response = cognitoService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Initiate password reset", description = "Sends password reset code to user's email")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestParam String username) {
        cognitoService.forgotPassword(username);
        return ResponseEntity.ok(Map.of("message", "Password reset code sent to your email"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets password using confirmation code")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody CognitoResetPasswordRequest request) {
        cognitoService.confirmForgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Signs out user from all devices")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("Authorization") String authorizationHeader) {
        String accessToken = authorizationHeader.replace("Bearer ", "");
        cognitoService.logout(accessToken);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/resend-code")
    @Operation(summary = "Resend confirmation code", description = "Resends the confirmation code to user's email")
    public ResponseEntity<Map<String, String>> resendConfirmationCode(@RequestParam String username) {
        cognitoService.resendConfirmationCode(username);
        return ResponseEntity.ok(Map.of("message", "Confirmation code resent to your email"));
    }

    private void enrichWithUserProfile(CognitoAuthResponse response, String email) {
        if (response.requiresChallenge()) return;
        try {
            userRepository.findByEmail(email).ifPresent(user -> {
                response.setFirstName(user.getFirstName());
                response.setLastName(user.getLastName());
            });
        } catch (Exception e) {
            log.warn("Could not enrich login response with user profile: {}", e.getMessage());
        }
    }
}
