package com.gastrack.security.cognito;

import com.gastrack.security.cognito.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("CognitoService Tests")
class CognitoServiceTest {

    private CognitoProperties cognitoProperties;

    @Mock
    private CognitoClientFactory clientFactory;

    @Mock
    private CognitoSecretHashCalculator secretHashCalculator;

    private CognitoService cognitoService;

    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "TestPassword123!";
    private static final String TEST_FIRST_NAME = "Test";
    private static final String TEST_LAST_NAME = "User";
    private static final String TEST_PHONE_NUMBER = "+5511999999999";
    private static final String TEST_CLIENT_ID = "test-client-id";
    private static final String TEST_CLIENT_SECRET = "test-client-secret";
    private static final String TEST_REGION = "us-east-1";
    private static final String TEST_CONFIRMATION_CODE = "123456";

    @BeforeEach
    void setUp() {
        cognitoProperties = new CognitoProperties();
        cognitoProperties.setClientId(TEST_CLIENT_ID);
        cognitoProperties.setClientSecret(TEST_CLIENT_SECRET);
        cognitoProperties.setRegion(TEST_REGION);
        cognitoService = new CognitoService(cognitoProperties, clientFactory, secretHashCalculator);
    }

    @Test
    @DisplayName("should_CreateCognitoService_When_PropertiesProvided")
    void should_CreateCognitoService_When_PropertiesProvided() {
        // Then
        assertThat(cognitoService).isNotNull();
    }

    @Test
    @DisplayName("should_HaveCorrectProperties_When_ServiceCreated")
    void should_HaveCorrectProperties_When_ServiceCreated() {
        // When/Then
        assertThat(cognitoProperties.getClientId()).isEqualTo(TEST_CLIENT_ID);
        assertThat(cognitoProperties.getClientSecret()).isEqualTo(TEST_CLIENT_SECRET);
        assertThat(cognitoProperties.getRegion()).isEqualTo(TEST_REGION);
    }

    @Test
    @DisplayName("should_BuildValidSignUpRequest_When_ValidDataProvided")
    void should_BuildValidSignUpRequest_When_ValidDataProvided() {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .phoneNumber(TEST_PHONE_NUMBER)
                .build();

        // Then
        assertThat(request).isNotNull();
        assertThat(request.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(request.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(request.getPassword()).isEqualTo(TEST_PASSWORD);
        assertThat(request.getFirstName()).isEqualTo(TEST_FIRST_NAME);
        assertThat(request.getLastName()).isEqualTo(TEST_LAST_NAME);
        assertThat(request.getFullName()).isEqualTo(TEST_FIRST_NAME + " " + TEST_LAST_NAME);
    }

    @Test
    @DisplayName("should_BuildValidLoginRequest_When_ValidCredentialsProvided")
    void should_BuildValidLoginRequest_When_ValidCredentialsProvided() {
        // Given
        CognitoLoginRequest request = CognitoLoginRequest.builder()
                .username(TEST_USERNAME)
                .password(TEST_PASSWORD)
                .build();

        // Then
        assertThat(request).isNotNull();
        assertThat(request.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(request.getPassword()).isEqualTo(TEST_PASSWORD);
    }

    @Test
    @DisplayName("should_BuildValidConfirmRequest_When_ValidCodeProvided")
    void should_BuildValidConfirmRequest_When_ValidCodeProvided() {
        // Given
        CognitoConfirmRequest request = CognitoConfirmRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .build();

        // Then
        assertThat(request).isNotNull();
        assertThat(request.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(request.getConfirmationCode()).isEqualTo(TEST_CONFIRMATION_CODE);
    }

    @Test
    @DisplayName("should_BuildValidRefreshRequest_When_ValidTokenProvided")
    void should_BuildValidRefreshRequest_When_ValidTokenProvided() {
        // Given
        String refreshToken = "test-refresh-token";
        CognitoRefreshRequest request = CognitoRefreshRequest.builder()
                .username(TEST_USERNAME)
                .refreshToken(refreshToken)
                .build();

        // Then
        assertThat(request).isNotNull();
        assertThat(request.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(request.getRefreshToken()).isEqualTo(refreshToken);
    }

    @Test
    @DisplayName("should_BuildValidResetPasswordRequest_When_ValidDataProvided")
    void should_BuildValidResetPasswordRequest_When_ValidDataProvided() {
        // Given
        String newPassword = "NewPassword123!";
        CognitoResetPasswordRequest request = CognitoResetPasswordRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .newPassword(newPassword)
                .build();

        // Then
        assertThat(request).isNotNull();
        assertThat(request.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(request.getConfirmationCode()).isEqualTo(TEST_CONFIRMATION_CODE);
        assertThat(request.getNewPassword()).isEqualTo(newPassword);
    }

    @Test
    @DisplayName("should_BuildSignUpResponse_When_ValidDataProvided")
    void should_BuildSignUpResponse_When_ValidDataProvided() {
        // Given
        String userSub = "user-sub-123";
        CognitoSignUpResponse response = CognitoSignUpResponse.builder()
                .userSub(userSub)
                .userConfirmed(false)
                .message("User registered successfully")
                .build();

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getUserSub()).isEqualTo(userSub);
        assertThat(response.getUserConfirmed()).isFalse();
        assertThat(response.getMessage()).contains("registered successfully");
    }

    @Test
    @DisplayName("should_BuildConfirmResponse_When_ValidDataProvided")
    void should_BuildConfirmResponse_When_ValidDataProvided() {
        // Given
        CognitoConfirmResponse response = CognitoConfirmResponse.builder()
                .confirmed(true)
                .message("Account confirmed successfully")
                .build();

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getConfirmed()).isTrue();
        assertThat(response.getMessage()).contains("confirmed successfully");
    }

    @Test
    @DisplayName("should_BuildAuthResponse_When_ValidTokensProvided")
    void should_BuildAuthResponse_When_ValidTokensProvided() {
        // Given
        String accessToken = "access-token";
        String idToken = "id-token";
        String refreshToken = "refresh-token";

        CognitoAuthResponse response = CognitoAuthResponse.builder()
                .accessToken(accessToken)
                .idToken(idToken)
                .refreshToken(refreshToken)
                .expiresIn(3600)
                .tokenType("Bearer")
                .build();

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo(accessToken);
        assertThat(response.getIdToken()).isEqualTo(idToken);
        assertThat(response.getRefreshToken()).isEqualTo(refreshToken);
        assertThat(response.getExpiresIn()).isEqualTo(3600);
        assertThat(response.getTokenType()).isEqualTo("Bearer");
    }

    @Test
    @DisplayName("should_ValidateRequestFields_When_BuildingSignUpRequest")
    void should_ValidateRequestFields_When_BuildingSignUpRequest() {
        // Given
        CognitoSignUpRequest request = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .build();

        // Then - All required fields should be present
        assertThat(request.getUsername()).isNotBlank();
        assertThat(request.getEmail()).isNotBlank();
        assertThat(request.getPassword()).isNotBlank();
        assertThat(request.getFirstName()).isNotBlank();
        assertThat(request.getLastName()).isNotBlank();
    }

    @Test
    @DisplayName("should_ValidateRequestFields_When_BuildingLoginRequest")
    void should_ValidateRequestFields_When_BuildingLoginRequest() {
        // Given
        CognitoLoginRequest request = CognitoLoginRequest.builder()
                .username(TEST_USERNAME)
                .password(TEST_PASSWORD)
                .build();

        // Then - All required fields should be present
        assertThat(request.getUsername()).isNotBlank();
        assertThat(request.getPassword()).isNotBlank();
    }

    @Test
    @DisplayName("should_ValidateRequestFields_When_BuildingConfirmRequest")
    void should_ValidateRequestFields_When_BuildingConfirmRequest() {
        // Given
        CognitoConfirmRequest request = CognitoConfirmRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .build();

        // Then - All required fields should be present
        assertThat(request.getUsername()).isNotBlank();
        assertThat(request.getConfirmationCode()).isNotBlank();
    }

    @Test
    @DisplayName("should_ValidateRequestFields_When_BuildingRefreshRequest")
    void should_ValidateRequestFields_When_BuildingRefreshRequest() {
        // Given
        CognitoRefreshRequest request = CognitoRefreshRequest.builder()
                .username(TEST_USERNAME)
                .refreshToken("refresh-token")
                .build();

        // Then - All required fields should be present
        assertThat(request.getUsername()).isNotBlank();
        assertThat(request.getRefreshToken()).isNotBlank();
    }

    @Test
    @DisplayName("should_ValidateRequestFields_When_BuildingResetPasswordRequest")
    void should_ValidateRequestFields_When_BuildingResetPasswordRequest() {
        // Given
        CognitoResetPasswordRequest request = CognitoResetPasswordRequest.builder()
                .username(TEST_USERNAME)
                .confirmationCode(TEST_CONFIRMATION_CODE)
                .newPassword("NewPassword123!")
                .build();

        // Then - All required fields should be present
        assertThat(request.getUsername()).isNotBlank();
        assertThat(request.getConfirmationCode()).isNotBlank();
        assertThat(request.getNewPassword()).isNotBlank();
    }

    @Test
    @DisplayName("should_UseBuilderPattern_When_CreatingRequests")
    void should_UseBuilderPattern_When_CreatingRequests() {
        // Given/When
        CognitoSignUpRequest signUpRequest = CognitoSignUpRequest.builder()
                .username(TEST_USERNAME)
                .build();

        CognitoLoginRequest loginRequest = CognitoLoginRequest.builder()
                .username(TEST_USERNAME)
                .build();

        // Then - Builder pattern works correctly
        assertThat(signUpRequest).isNotNull();
        assertThat(loginRequest).isNotNull();
    }

    @Test
    @DisplayName("should_AllowEmptyConstructor_When_CreatingDTOs")
    void should_AllowEmptyConstructor_When_CreatingDTOs() {
        // When
        CognitoSignUpRequest request1 = new CognitoSignUpRequest();
        CognitoAuthResponse response1 = new CognitoAuthResponse();

        // Then
        assertThat(request1).isNotNull();
        assertThat(response1).isNotNull();
    }

    @Test
    @DisplayName("should_AllowSetters_When_CreatingDTOs")
    void should_AllowSetters_When_CreatingDTOs() {
        // Given
        CognitoLoginRequest request = new CognitoLoginRequest();

        // When
        request.setUsername(TEST_USERNAME);
        request.setPassword(TEST_PASSWORD);

        // Then
        assertThat(request.getUsername()).isEqualTo(TEST_USERNAME);
        assertThat(request.getPassword()).isEqualTo(TEST_PASSWORD);
    }

    // ==================== Admin Operations Tests ====================

    @Test
    @DisplayName("should_BuildValidAdminCreateUserRequest_When_ValidDataProvided")
    void should_BuildValidAdminCreateUserRequest_When_ValidDataProvided() {
        // Given
        CognitoAdminCreateUserRequest request = CognitoAdminCreateUserRequest.builder()
                .email(TEST_EMAIL)
                .firstName(TEST_FIRST_NAME)
                .lastName(TEST_LAST_NAME)
                .phoneNumber(TEST_PHONE_NUMBER)
                .sendEmail(true)
                .build();

        // Then
        assertThat(request).isNotNull();
        assertThat(request.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(request.getFirstName()).isEqualTo(TEST_FIRST_NAME);
        assertThat(request.getLastName()).isEqualTo(TEST_LAST_NAME);
        assertThat(request.getPhoneNumber()).isEqualTo(TEST_PHONE_NUMBER);
        assertThat(request.isSendEmail()).isTrue();
    }

    @Test
    @DisplayName("should_BuildAdminCreateUserRequest_WithDefaultSendEmail")
    void should_BuildAdminCreateUserRequest_WithDefaultSendEmail() {
        // Given
        CognitoAdminCreateUserRequest request = CognitoAdminCreateUserRequest.builder()
                .email(TEST_EMAIL)
                .build();

        // Then - sendEmail should default to true
        assertThat(request.isSendEmail()).isTrue();
    }

    @Test
    @DisplayName("should_BuildValidAdminCreateUserResponse_When_ValidDataProvided")
    void should_BuildValidAdminCreateUserResponse_When_ValidDataProvided() {
        // Given
        String userSub = "admin-created-user-sub";
        String username = "admin@test.com";

        CognitoAdminCreateUserResponse response = CognitoAdminCreateUserResponse.builder()
                .userSub(userSub)
                .username(username)
                .userStatus("FORCE_CHANGE_PASSWORD")
                .emailSent(true)
                .message("User created successfully")
                .build();

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getUserSub()).isEqualTo(userSub);
        assertThat(response.getUsername()).isEqualTo(username);
        assertThat(response.getUserStatus()).isEqualTo("FORCE_CHANGE_PASSWORD");
        assertThat(response.isEmailSent()).isTrue();
        assertThat(response.getMessage()).contains("created successfully");
    }

    @Test
    @DisplayName("should_AllowEmptyConstructor_ForAdminCreateUserRequest")
    void should_AllowEmptyConstructor_ForAdminCreateUserRequest() {
        // When
        CognitoAdminCreateUserRequest request = new CognitoAdminCreateUserRequest();

        // Then
        assertThat(request).isNotNull();
    }

    @Test
    @DisplayName("should_AllowEmptyConstructor_ForAdminCreateUserResponse")
    void should_AllowEmptyConstructor_ForAdminCreateUserResponse() {
        // When
        CognitoAdminCreateUserResponse response = new CognitoAdminCreateUserResponse();

        // Then
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("should_AllowSetters_ForAdminCreateUserRequest")
    void should_AllowSetters_ForAdminCreateUserRequest() {
        // Given
        CognitoAdminCreateUserRequest request = new CognitoAdminCreateUserRequest();

        // When
        request.setEmail(TEST_EMAIL);
        request.setFirstName(TEST_FIRST_NAME);
        request.setLastName(TEST_LAST_NAME);
        request.setSendEmail(false);

        // Then
        assertThat(request.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(request.getFirstName()).isEqualTo(TEST_FIRST_NAME);
        assertThat(request.getLastName()).isEqualTo(TEST_LAST_NAME);
        assertThat(request.isSendEmail()).isFalse();
    }

    @Test
    @DisplayName("should_AllowSetters_ForAdminCreateUserResponse")
    void should_AllowSetters_ForAdminCreateUserResponse() {
        // Given
        CognitoAdminCreateUserResponse response = new CognitoAdminCreateUserResponse();

        // When
        response.setUserSub("test-sub");
        response.setUsername("test@test.com");
        response.setUserStatus("CONFIRMED");
        response.setEmailSent(true);
        response.setMessage("Success");

        // Then
        assertThat(response.getUserSub()).isEqualTo("test-sub");
        assertThat(response.getUsername()).isEqualTo("test@test.com");
        assertThat(response.getUserStatus()).isEqualTo("CONFIRMED");
        assertThat(response.isEmailSent()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Success");
    }
}
