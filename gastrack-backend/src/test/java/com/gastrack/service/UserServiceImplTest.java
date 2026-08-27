package com.gastrack.service;

import com.gastrack.exceptions.UserAlreadyExistsException;
import com.gastrack.exceptions.UserNotFoundException;
import com.gastrack.model.InvitationStatus;
import com.gastrack.model.User;
import com.gastrack.model.UserInvitation;
import com.gastrack.model.UserRole;
import com.gastrack.repository.UserInvitationRepository;
import com.gastrack.repository.UserRepository;
import com.gastrack.service.dto.UpdateUserRequest;
import com.gastrack.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserInvitationRepository invitationRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private static final String TEST_COGNITO_SUB = "test-cognito-sub-123";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_USERNAME = "testuser";

    @BeforeEach
    void setUp() {
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
    @DisplayName("should_CreateUser_When_ValidDataProvided")
    void should_CreateUser_When_ValidDataProvided() {
        // Given
        when(userRepository.existsByCognitoSub(TEST_COGNITO_SUB)).thenReturn(false);
        when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.createUser(TEST_COGNITO_SUB, TEST_EMAIL, "Test", "User", null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCognitoSub()).isEqualTo(TEST_COGNITO_SUB);
        assertThat(result.getEmail()).isEqualTo(TEST_EMAIL);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("should_ThrowException_When_UserAlreadyExistsByCognitoSub")
    void should_ThrowException_When_UserAlreadyExistsByCognitoSub() {
        // Given
        when(userRepository.existsByCognitoSub(TEST_COGNITO_SUB)).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> userService.createUser(TEST_COGNITO_SUB, TEST_EMAIL, "Test", "User", null))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("User already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should_ThrowException_When_UserAlreadyExistsByEmail")
    void should_ThrowException_When_UserAlreadyExistsByEmail() {
        // Given
        when(userRepository.existsByCognitoSub(TEST_COGNITO_SUB)).thenReturn(false);
        when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> userService.createUser(TEST_COGNITO_SUB, TEST_EMAIL, "Test", "User", null))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should_FindUserByCognitoSub_When_UserExists")
    void should_FindUserByCognitoSub_When_UserExists() {
        // Given
        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));

        // When
        User result = userService.findByCognitoSub(TEST_COGNITO_SUB);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getCognitoSub()).isEqualTo(TEST_COGNITO_SUB);
        verify(userRepository).findByCognitoSub(TEST_COGNITO_SUB);
    }

    @Test
    @DisplayName("should_ThrowException_When_UserNotFoundByCognitoSub")
    void should_ThrowException_When_UserNotFoundByCognitoSub() {
        // Given
        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.findByCognitoSub(TEST_COGNITO_SUB))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("not found");

        verify(userRepository).findByCognitoSub(TEST_COGNITO_SUB);
    }

    @Test
    @DisplayName("should_FindUserByEmail_When_UserExists")
    void should_FindUserByEmail_When_UserExists() {
        // Given
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));

        // When
        User result = userService.findByEmail(TEST_EMAIL);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo(TEST_EMAIL);
        verify(userRepository).findByEmail(TEST_EMAIL);
    }

    @Test
    @DisplayName("should_UpdateUser_When_ValidDataProvided")
    void should_UpdateUser_When_ValidDataProvided() {
        // Given
        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setFirstName("Updated");
        updateRequest.setLastName("Name");
        updateRequest.setPhoneNumber("+5511999999999");

        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        User result = userService.updateUser(TEST_COGNITO_SUB, updateRequest);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("should_DeactivateUser_When_UserExists")
    void should_DeactivateUser_When_UserExists() {
        // Given
        when(userRepository.existsByCognitoSub(TEST_COGNITO_SUB)).thenReturn(true);
        doNothing().when(userRepository).deactivateByCognitoSub(TEST_COGNITO_SUB);

        // When
        userService.deactivateUser(TEST_COGNITO_SUB);

        // Then
        verify(userRepository).existsByCognitoSub(TEST_COGNITO_SUB);
        verify(userRepository).deactivateByCognitoSub(TEST_COGNITO_SUB);
    }

    @Test
    @DisplayName("should_UpdateLastLogin_When_UserExists")
    void should_UpdateLastLogin_When_UserExists() {
        // Given
        when(userRepository.existsByCognitoSub(TEST_COGNITO_SUB)).thenReturn(true);
        doNothing().when(userRepository).updateLastLoginAt(eq(TEST_COGNITO_SUB), any(LocalDateTime.class));

        // When
        userService.updateLastLogin(TEST_COGNITO_SUB);

        // Then
        verify(userRepository).existsByCognitoSub(TEST_COGNITO_SUB);
        verify(userRepository).updateLastLoginAt(eq(TEST_COGNITO_SUB), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("should_CheckIfUserExistsByCognitoSub_When_UserExists")
    void should_CheckIfUserExistsByCognitoSub_When_UserExists() {
        // Given
        when(userRepository.existsByCognitoSub(TEST_COGNITO_SUB)).thenReturn(true);

        // When
        boolean result = userService.existsByCognitoSub(TEST_COGNITO_SUB);

        // Then
        assertThat(result).isTrue();
        verify(userRepository).existsByCognitoSub(TEST_COGNITO_SUB);
    }

    @Test
    @DisplayName("should_SetLastLoginAtFromAuthTime_When_RecordLogin")
    void should_SetLastLoginAtFromAuthTime_When_RecordLogin() {
        // Given - first login (lastLoginAt null), no pending invitation
        Instant authTime = Instant.parse("2026-07-24T10:15:30Z");
        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));
        when(invitationRepository.findPendingByEmail(TEST_EMAIL)).thenReturn(Optional.empty());

        // When
        userService.recordLogin(TEST_COGNITO_SUB, authTime);

        // Then
        assertThat(testUser.getLastLoginAt())
                .isEqualTo(LocalDateTime.ofInstant(authTime, ZoneOffset.UTC));
        verify(userRepository).save(testUser);
        verify(invitationRepository, never()).save(any());
    }

    @Test
    @DisplayName("should_FlipPendingInvitationToAccepted_When_FirstLogin")
    void should_FlipPendingInvitationToAccepted_When_FirstLogin() {
        // Given - first login (lastLoginAt null) with a pending invitation
        Instant authTime = Instant.parse("2026-07-24T10:15:30Z");
        UserInvitation invitation = UserInvitation.builder()
                .id(1L)
                .email(TEST_EMAIL)
                .role(UserRole.USER)
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));
        when(invitationRepository.findPendingByEmail(TEST_EMAIL)).thenReturn(Optional.of(invitation));

        // When
        userService.recordLogin(TEST_COGNITO_SUB, authTime);

        // Then
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.ACCEPTED);
        verify(userRepository).save(testUser);
        verify(invitationRepository).save(invitation);
    }

    @Test
    @DisplayName("should_NoOp_When_AuthTimeNotAfterLastLogin")
    void should_NoOp_When_AuthTimeNotAfterLastLogin() {
        // Given - lastLoginAt already set from the same auth_time (same session)
        Instant authTime = Instant.parse("2026-07-24T10:15:30Z");
        LocalDateTime existing = LocalDateTime.ofInstant(authTime, ZoneOffset.UTC);
        testUser.setLastLoginAt(existing);
        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));

        // When
        userService.recordLogin(TEST_COGNITO_SUB, authTime);

        // Then - no write, no invitation flip, lastLoginAt unchanged
        assertThat(testUser.getLastLoginAt()).isEqualTo(existing);
        verify(userRepository, never()).save(any());
        verify(invitationRepository, never()).findPendingByEmail(any());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    @DisplayName("should_OnlySetLastLoginAt_When_RecordLoginAndNoPendingInvitation")
    void should_OnlySetLastLoginAt_When_RecordLoginAndNoPendingInvitation() {
        // Given - subsequent login (lastLoginAt already set, older) so no invitation lookup
        Instant authTime = Instant.parse("2026-07-24T12:00:00Z");
        testUser.setLastLoginAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));

        // When
        userService.recordLogin(TEST_COGNITO_SUB, authTime);

        // Then - lastLoginAt advanced, but no invitation touched (not first login)
        assertThat(testUser.getLastLoginAt())
                .isEqualTo(LocalDateTime.ofInstant(authTime, ZoneOffset.UTC));
        verify(userRepository).save(testUser);
        verify(invitationRepository, never()).findPendingByEmail(any());
    }

    @Test
    @DisplayName("should_ReturnExistingUser_When_HandleFirstLoginAndUserAlreadyProvisioned")
    void should_ReturnExistingUser_When_HandleFirstLoginAndUserAlreadyProvisioned() {
        // Given - user was already provisioned at invitation creation time
        when(userRepository.findByCognitoSub(TEST_COGNITO_SUB)).thenReturn(Optional.of(testUser));

        // When
        Optional<User> result = userService.handleFirstLogin(TEST_COGNITO_SUB, TEST_EMAIL);

        // Then - existing user returned, no duplicate created, invitation untouched
        assertThat(result).contains(testUser);
        verify(userRepository, never()).save(any(User.class));
        verify(invitationRepository, never()).findPendingByEmail(any());
    }

}
