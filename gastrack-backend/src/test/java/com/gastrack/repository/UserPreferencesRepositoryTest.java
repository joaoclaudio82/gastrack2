package com.gastrack.repository;

import com.gastrack.model.User;
import com.gastrack.model.UserPreferences;
import com.gastrack.model.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserPreferencesRepositoryTest {

    @Autowired
    private UserPreferencesRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void should_FindByUserId_When_PreferenceExists() {
        User user = userRepository.save(User.builder()
                .cognitoSub("sub-prefs-1")
                .email("prefs1@example.com")
                .role(UserRole.SUPER_ADMIN)
                .build());

        UserPreferences saved = repository.save(UserPreferences.builder()
                .user(user)
                .analyticsRefreshIntervalSeconds(12)
                .analyticsStreamingPaused(true)
                .build());

        Optional<UserPreferences> found = repository.findByUserId(user.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(found.get().getAnalyticsRefreshIntervalSeconds()).isEqualTo(12);
        assertThat(found.get().getAnalyticsStreamingPaused()).isTrue();
    }

    @Test
    void should_ReturnEmpty_When_PreferenceDoesNotExist() {
        Optional<UserPreferences> found = repository.findByUserId(999_999L);
        assertThat(found).isEmpty();
    }
}
