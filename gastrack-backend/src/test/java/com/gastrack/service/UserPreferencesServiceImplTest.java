package com.gastrack.service;

import com.gastrack.dto.UpdateUserPreferencesRequest;
import com.gastrack.dto.UserPreferencesResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.UserPreferencesMapper;
import com.gastrack.model.User;
import com.gastrack.model.UserPreferences;
import com.gastrack.repository.UserPreferencesRepository;
import com.gastrack.repository.UserRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.impl.UserPreferencesServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPreferencesServiceImplTest {

    @Mock private UserPreferencesRepository preferencesRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserPreferencesMapper mapper;

    @InjectMocks
    private UserPreferencesServiceImpl service;

    private static final String SUB = "sub-abc";

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentUserSub(SUB);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void should_CreateDefaults_When_PreferencesDoNotExist() {
        User user = User.builder().id(1L).cognitoSub(SUB).build();
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(user));
        when(preferencesRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(preferencesRepository.save(any(UserPreferences.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(UserPreferences.class)))
            .thenReturn(new UserPreferencesResponse(5, false));

        UserPreferencesResponse result = service.getCurrent();

        ArgumentCaptor<UserPreferences> captor = ArgumentCaptor.forClass(UserPreferences.class);
        verify(preferencesRepository).save(captor.capture());
        UserPreferences saved = captor.getValue();
        assertThat(saved.getAnalyticsRefreshIntervalSeconds()).isEqualTo(5);
        assertThat(saved.getAnalyticsStreamingPaused()).isFalse();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(result.analyticsRefreshIntervalSeconds()).isEqualTo(5);
    }

    @Test
    void should_ReturnExisting_When_PreferencesExist() {
        User user = User.builder().id(2L).cognitoSub(SUB).build();
        UserPreferences existing = UserPreferences.builder()
                .id(10L).user(user)
                .analyticsRefreshIntervalSeconds(15)
                .analyticsStreamingPaused(true)
                .build();
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(user));
        when(preferencesRepository.findByUserId(2L)).thenReturn(Optional.of(existing));
        when(mapper.toResponse(existing))
            .thenReturn(new UserPreferencesResponse(15, true));

        UserPreferencesResponse result = service.getCurrent();

        verify(preferencesRepository, never()).save(any());
        assertThat(result.analyticsRefreshIntervalSeconds()).isEqualTo(15);
        assertThat(result.analyticsStreamingPaused()).isTrue();
    }

    @Test
    void should_ApplyPartialUpdate_When_UpdateCurrentCalled() {
        User user = User.builder().id(3L).cognitoSub(SUB).build();
        UserPreferences existing = UserPreferences.builder()
                .id(11L).user(user)
                .analyticsRefreshIntervalSeconds(5)
                .analyticsStreamingPaused(false)
                .build();
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(user));
        when(preferencesRepository.findByUserId(3L)).thenReturn(Optional.of(existing));
        when(preferencesRepository.save(any(UserPreferences.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(UserPreferences.class)))
            .thenReturn(new UserPreferencesResponse(20, false));

        UpdateUserPreferencesRequest request = new UpdateUserPreferencesRequest(20, null);
        UserPreferencesResponse result = service.updateCurrent(request);

        assertThat(existing.getAnalyticsRefreshIntervalSeconds()).isEqualTo(20);
        assertThat(existing.getAnalyticsStreamingPaused()).isFalse();
        assertThat(result.analyticsRefreshIntervalSeconds()).isEqualTo(20);
    }

    @Test
    void should_UpdateOnlyPausedFlag_When_OnlyPausedProvided() {
        User user = User.builder().id(4L).cognitoSub(SUB).build();
        UserPreferences existing = UserPreferences.builder()
                .id(12L).user(user)
                .analyticsRefreshIntervalSeconds(7)
                .analyticsStreamingPaused(false)
                .build();
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(user));
        when(preferencesRepository.findByUserId(4L)).thenReturn(Optional.of(existing));
        when(preferencesRepository.save(any(UserPreferences.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any(UserPreferences.class)))
            .thenReturn(new UserPreferencesResponse(7, true));

        service.updateCurrent(new UpdateUserPreferencesRequest(null, true));

        assertThat(existing.getAnalyticsRefreshIntervalSeconds()).isEqualTo(7);
        assertThat(existing.getAnalyticsStreamingPaused()).isTrue();
    }

    @Test
    void should_Throw_When_AuthenticatedUserNotFound() {
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCurrent())
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
