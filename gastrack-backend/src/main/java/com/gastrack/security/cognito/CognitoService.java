package com.gastrack.security.cognito;

import com.gastrack.exceptions.CognitoAuthException;
import com.gastrack.security.cognito.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for AWS Cognito authentication operations.
 * Provides methods for user registration, authentication, and password management.
 * This service focuses purely on Cognito API interactions.
 */
@Slf4j
@Service

@RequiredArgsConstructor
public class CognitoService {

    private final CognitoProperties cognitoProperties;
    private final CognitoClientFactory clientFactory;
    private final CognitoSecretHashCalculator secretHashCalculator;

    public CognitoSignUpResponse signUp(CognitoSignUpRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            // Build user attributes list
            java.util.List<AttributeType> userAttributes = new java.util.ArrayList<>();
            userAttributes.add(AttributeType.builder().name("email").value(request.getEmail()).build());
            userAttributes.add(AttributeType.builder().name("given_name").value(request.getFirstName()).build());
            userAttributes.add(AttributeType.builder().name("family_name").value(request.getLastName()).build());
            userAttributes.add(AttributeType.builder().name("name").value(request.getFullName()).build());

            // Add phone number if provided
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
                userAttributes.add(AttributeType.builder().name("phone_number").value(request.getPhoneNumber()).build());
            }

            SignUpRequest signUpRequest = SignUpRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .secretHash(secretHashCalculator.calculateSecretHash(request.getUsername()))
                    .username(request.getUsername())
                    .password(request.getPassword())
                    .userAttributes(userAttributes)
                    .build();

            SignUpResponse response = client.signUp(signUpRequest);
            log.info("User signed up successfully: {}", request.getUsername());

            return CognitoSignUpResponse.builder()
                    .userSub(response.userSub())
                    .userConfirmed(response.userConfirmed())
                    .message("User registered successfully. Please check your email for confirmation code.")
                    .build();
        } catch (CognitoIdentityProviderException e) {
            log.error("Error signing up user: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    public CognitoConfirmResponse confirmSignUp(CognitoConfirmRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            ConfirmSignUpRequest confirmRequest = ConfirmSignUpRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .secretHash(secretHashCalculator.calculateSecretHash(request.getUsername()))
                    .username(request.getUsername())
                    .confirmationCode(request.getConfirmationCode())
                    .build();

            client.confirmSignUp(confirmRequest);
            log.info("User confirmed successfully: {}", request.getUsername());

            return CognitoConfirmResponse.builder()
                    .confirmed(true)
                    .message("Account confirmed successfully. You can now login.")
                    .build();
        } catch (CognitoIdentityProviderException e) {
            log.error("Error confirming user: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    public CognitoAuthResponse login(CognitoLoginRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            Map<String, String> authParams = new HashMap<>();
            authParams.put("USERNAME", request.getUsername());
            authParams.put("PASSWORD", request.getPassword());
            authParams.put("SECRET_HASH", secretHashCalculator.calculateSecretHash(request.getUsername()));

            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .authParameters(authParams)
                    .build();

            InitiateAuthResponse response = client.initiateAuth(authRequest);

            // Check if challenge is required (e.g., NEW_PASSWORD_REQUIRED)
            if (response.challengeName() != null) {
                log.info("Challenge required for user {}: {}", request.getUsername(), response.challengeNameAsString());
                return CognitoAuthResponse.builder()
                        .challengeName(response.challengeNameAsString())
                        .session(response.session())
                        .build();
            }

            AuthenticationResultType authResult = response.authenticationResult();
            log.info("User logged in successfully: {}", request.getUsername());

            return CognitoAuthResponse.builder()
                    .accessToken(authResult.accessToken())
                    .idToken(authResult.idToken())
                    .refreshToken(authResult.refreshToken())
                    .expiresIn(authResult.expiresIn())
                    .tokenType(authResult.tokenType())
                    .build();
        } catch (CognitoIdentityProviderException e) {
            log.error("Error logging in user: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Responds to an authentication challenge (e.g., NEW_PASSWORD_REQUIRED).
     * Used when user needs to set a new password on first login.
     *
     * @param request the challenge response request
     * @return authentication response with tokens
     */
    public CognitoAuthResponse respondToChallenge(CognitoRespondChallengeRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            Map<String, String> challengeResponses = new HashMap<>();
            challengeResponses.put("USERNAME", request.getUsername());
            challengeResponses.put("NEW_PASSWORD", request.getNewPassword());
            challengeResponses.put("SECRET_HASH", secretHashCalculator.calculateSecretHash(request.getUsername()));

            RespondToAuthChallengeRequest challengeRequest = RespondToAuthChallengeRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .challengeName(ChallengeNameType.fromValue(request.getChallengeName()))
                    .session(request.getSession())
                    .challengeResponses(challengeResponses)
                    .build();

            RespondToAuthChallengeResponse response = client.respondToAuthChallenge(challengeRequest);

            // Check if another challenge is required
            if (response.challengeName() != null) {
                log.info("Another challenge required for user {}: {}", request.getUsername(), response.challengeNameAsString());
                return CognitoAuthResponse.builder()
                        .challengeName(response.challengeNameAsString())
                        .session(response.session())
                        .build();
            }

            AuthenticationResultType authResult = response.authenticationResult();
            log.info("Challenge completed successfully for user: {}", request.getUsername());

            return CognitoAuthResponse.builder()
                    .accessToken(authResult.accessToken())
                    .idToken(authResult.idToken())
                    .refreshToken(authResult.refreshToken())
                    .expiresIn(authResult.expiresIn())
                    .tokenType(authResult.tokenType())
                    .build();
        } catch (CognitoIdentityProviderException e) {
            log.error("Error responding to challenge: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    public CognitoAuthResponse refreshToken(CognitoRefreshRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            // Extract username from idToken if not provided
            String username = request.getUsername();
            if (username == null || username.isBlank()) {
                username = extractUsernameFromIdToken(request.getIdToken());
            }

            Map<String, String> authParams = new HashMap<>();
            authParams.put("REFRESH_TOKEN", request.getRefreshToken());
            authParams.put("SECRET_HASH", secretHashCalculator.calculateSecretHash(username));

            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
                    .authParameters(authParams)
                    .build();

            InitiateAuthResponse response = client.initiateAuth(authRequest);
            AuthenticationResultType authResult = response.authenticationResult();

            log.info("Token refreshed successfully for user: {}", username);

            return CognitoAuthResponse.builder()
                    .accessToken(authResult.accessToken())
                    .idToken(authResult.idToken())
                    .refreshToken(request.getRefreshToken()) // Cognito não retorna novo refresh token
                    .expiresIn(authResult.expiresIn())
                    .tokenType(authResult.tokenType())
                    .build();
        } catch (CognitoIdentityProviderException e) {
            log.error("Error refreshing token: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Extrai o username do payload do ID token (apenas Base64; nao valida assinatura).
     * Usado para calcular SECRET_HASH no refresh; ordem dos claims alinhada ao Cognito.
     */
    private String extractUsernameFromIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new CognitoAuthException("ID token or username is required for token refresh", HttpStatus.BAD_REQUEST);
        }

        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new CognitoAuthException("Invalid ID token format", HttpStatus.BAD_REQUEST);
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            ObjectMapper mapper = new ObjectMapper();
            JsonNode claims = mapper.readTree(payload);

            // cognito:username primeiro — SECRET_HASH no refresh deve coincidir com o username interno do pool
            if (claims.has("cognito:username")) {
                return claims.get("cognito:username").asText();
            }
            if (claims.has("email")) {
                return claims.get("email").asText();
            }
            if (claims.has("sub")) {
                return claims.get("sub").asText();
            }

            throw new CognitoAuthException("Could not extract username from ID token", HttpStatus.BAD_REQUEST);
        } catch (CognitoAuthException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error decoding ID token: {}", e.getMessage());
            throw new CognitoAuthException("Failed to decode ID token", HttpStatus.BAD_REQUEST);
        }
    }

    public void forgotPassword(String username) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .secretHash(secretHashCalculator.calculateSecretHash(username))
                    .username(username)
                    .build();

            client.forgotPassword(request);
            log.info("Password reset code sent to user: {}", username);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error initiating forgot password: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    public void confirmForgotPassword(CognitoResetPasswordRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            ConfirmForgotPasswordRequest confirmRequest = ConfirmForgotPasswordRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .secretHash(secretHashCalculator.calculateSecretHash(request.getUsername()))
                    .username(request.getUsername())
                    .confirmationCode(request.getConfirmationCode())
                    .password(request.getNewPassword())
                    .build();

            client.confirmForgotPassword(confirmRequest);
            log.info("Password reset successfully for user: {}", request.getUsername());
        } catch (CognitoIdentityProviderException e) {
            log.error("Error confirming forgot password: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    public void logout(String accessToken) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            GlobalSignOutRequest request = GlobalSignOutRequest.builder()
                    .accessToken(accessToken)
                    .build();

            client.globalSignOut(request);
            log.info("User logged out successfully");
        } catch (CognitoIdentityProviderException e) {
            log.error("Error logging out user: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    public void resendConfirmationCode(String username) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            ResendConfirmationCodeRequest request = ResendConfirmationCodeRequest.builder()
                    .clientId(cognitoProperties.getClientId())
                    .secretHash(secretHashCalculator.calculateSecretHash(username))
                    .username(username)
                    .build();

            client.resendConfirmationCode(request);
            log.info("Confirmation code resent to user: {}", username);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error resending confirmation code: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    // ==================== Admin Operations ====================

    /**
     * Creates a user in Cognito with a temporary password.
     * Cognito will send an email to the user with the temporary password.
     * The user must change the password on first login.
     *
     * @param request the admin create user request
     * @return response with user details
     */
    public CognitoAdminCreateUserResponse adminCreateUser(CognitoAdminCreateUserRequest request) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            // Build user attributes
            java.util.List<AttributeType> userAttributes = new java.util.ArrayList<>();
            userAttributes.add(AttributeType.builder().name("email").value(request.getEmail()).build());
            userAttributes.add(AttributeType.builder().name("email_verified").value("true").build());

            if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
                userAttributes.add(AttributeType.builder().name("given_name").value(request.getFirstName()).build());
            }
            if (request.getLastName() != null && !request.getLastName().isBlank()) {
                userAttributes.add(AttributeType.builder().name("family_name").value(request.getLastName()).build());
            }
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
                userAttributes.add(AttributeType.builder().name("phone_number").value(request.getPhoneNumber()).build());
            }

            // Build full name
            String fullName = buildFullName(request.getFirstName(), request.getLastName());
            if (fullName != null) {
                userAttributes.add(AttributeType.builder().name("name").value(fullName).build());
            }

            AdminCreateUserRequest.Builder createUserBuilder = AdminCreateUserRequest.builder()
                    .userPoolId(cognitoProperties.getUserPoolId())
                    .username(request.getEmail())
                    .userAttributes(userAttributes)
                    .forceAliasCreation(false);

            // Set delivery mechanism
            if (request.isSendEmail()) {
                createUserBuilder.desiredDeliveryMediums(DeliveryMediumType.EMAIL);
            } else {
                createUserBuilder.messageAction(MessageActionType.SUPPRESS);
            }

            AdminCreateUserResponse response = client.adminCreateUser(createUserBuilder.build());
            UserType user = response.user();

            log.info("Admin created user successfully: {}", request.getEmail());

            return CognitoAdminCreateUserResponse.builder()
                    .userSub(extractAttributeValue(user.attributes(), "sub"))
                    .username(user.username())
                    .userStatus(user.userStatusAsString())
                    .emailSent(request.isSendEmail())
                    .message("User created successfully. " +
                            (request.isSendEmail() ? "Temporary password sent via email." : "Temporary password suppressed."))
                    .build();

        } catch (UsernameExistsException e) {
            log.error("User already exists in Cognito: {}", request.getEmail());
            throw new CognitoAuthException("User with this email already exists", HttpStatus.CONFLICT);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error creating user via admin API: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Resends the invitation email to a user by creating a new temporary password.
     * This is useful when the original invitation email was lost or expired.
     *
     * @param username the username (email) of the user
     */
    public void adminResendInvitation(String username) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            // Use AdminCreateUser with RESEND to resend the invitation
            AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                    .userPoolId(cognitoProperties.getUserPoolId())
                    .username(username)
                    .messageAction(MessageActionType.RESEND)
                    .desiredDeliveryMediums(DeliveryMediumType.EMAIL)
                    .build();

            client.adminCreateUser(request);
            log.info("Invitation resent to user: {}", username);

        } catch (UserNotFoundException e) {
            log.error("User not found in Cognito: {}", username);
            throw new CognitoAuthException("User not found in Cognito", HttpStatus.NOT_FOUND);
        } catch (UnsupportedUserStateException e) {
            log.error("Cannot resend invitation - user already confirmed: {}", username);
            throw new CognitoAuthException("Cannot resend invitation to a confirmed user", HttpStatus.BAD_REQUEST);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error resending invitation: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Adds a user to a Cognito group.
     * Groups are used for role-based access control (USER, ADMIN, SUPER_ADMIN).
     *
     * @param username the username (email) of the user
     * @param groupName the name of the group to add the user to
     */
    public void adminAddUserToGroup(String username, String groupName) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            AdminAddUserToGroupRequest request = AdminAddUserToGroupRequest.builder()
                    .userPoolId(cognitoProperties.getUserPoolId())
                    .username(username)
                    .groupName(groupName)
                    .build();

            client.adminAddUserToGroup(request);
            log.info("User {} added to group {}", username, groupName);

        } catch (UserNotFoundException e) {
            log.error("User not found in Cognito: {}", username);
            throw new CognitoAuthException("User not found in Cognito", HttpStatus.NOT_FOUND);
        } catch (ResourceNotFoundException e) {
            log.error("Group not found in Cognito: {}", groupName);
            throw new CognitoAuthException("Group '" + groupName + "' not found in Cognito. Please create it first.", HttpStatus.NOT_FOUND);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error adding user to group: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Removes a user from a Cognito group.
     *
     * @param username the username (email) of the user
     * @param groupName the name of the group to remove the user from
     */
    public void adminRemoveUserFromGroup(String username, String groupName) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            AdminRemoveUserFromGroupRequest request = AdminRemoveUserFromGroupRequest.builder()
                    .userPoolId(cognitoProperties.getUserPoolId())
                    .username(username)
                    .groupName(groupName)
                    .build();

            client.adminRemoveUserFromGroup(request);
            log.info("User {} removed from group {}", username, groupName);

        } catch (UserNotFoundException e) {
            log.warn("User not found in Cognito (may have been already deleted): {}", username);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error removing user from group: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Deletes a user from Cognito.
     * Used when cancelling an invitation before the user has accepted it.
     *
     * @param username the username (email) of the user to delete
     */
    public void adminDeleteUser(String username) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            AdminDeleteUserRequest request = AdminDeleteUserRequest.builder()
                    .userPoolId(cognitoProperties.getUserPoolId())
                    .username(username)
                    .build();

            client.adminDeleteUser(request);
            log.info("User deleted from Cognito: {}", username);

        } catch (UserNotFoundException e) {
            // User doesn't exist, which is fine for our purposes
            log.warn("User not found in Cognito (may have been already deleted): {}", username);
        } catch (CognitoIdentityProviderException e) {
            log.error("Error deleting user from Cognito: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    /**
     * Gets user information from Cognito by username.
     *
     * @param username the username (email) of the user
     * @return the user's sub (unique identifier) or null if not found
     */
    public String adminGetUserSub(String username) {
        try (CognitoIdentityProviderClient client = clientFactory.createClient()) {
            AdminGetUserRequest request = AdminGetUserRequest.builder()
                    .userPoolId(cognitoProperties.getUserPoolId())
                    .username(username)
                    .build();

            AdminGetUserResponse response = client.adminGetUser(request);
            return extractAttributeValue(response.userAttributes(), "sub");

        } catch (UserNotFoundException e) {
            log.warn("User not found in Cognito: {}", username);
            return null;
        } catch (CognitoIdentityProviderException e) {
            log.error("Error getting user from Cognito: {}", e.awsErrorDetails().errorMessage());
            throw CognitoAuthException.fromCognitoError(e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage());
        }
    }

    // ==================== Helper Methods ====================

    private String extractAttributeValue(java.util.List<AttributeType> attributes, String attributeName) {
        return attributes.stream()
                .filter(attr -> attributeName.equals(attr.name()))
                .map(AttributeType::value)
                .findFirst()
                .orElse(null);
    }

    private String buildFullName(String firstName, String lastName) {
        if ((firstName == null || firstName.isBlank()) && (lastName == null || lastName.isBlank())) {
            return null;
        }
        StringBuilder name = new StringBuilder();
        if (firstName != null && !firstName.isBlank()) {
            name.append(firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            if (name.length() > 0) {
                name.append(" ");
            }
            name.append(lastName);
        }
        return name.toString();
    }
}
