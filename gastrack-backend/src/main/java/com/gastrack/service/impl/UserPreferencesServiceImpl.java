package com.gastrack.service.impl;

import com.gastrack.dto.UpdateUserPreferencesRequest;
import com.gastrack.dto.UserPreferencesResponse;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.UserPreferencesMapper;
import com.gastrack.model.User;
import com.gastrack.model.UserPreferences;
import com.gastrack.repository.UserPreferencesRepository;
import com.gastrack.repository.UserRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.service.UserPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPreferencesServiceImpl implements UserPreferencesService {

    private final UserPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;
    private final UserPreferencesMapper mapper;

    @Override
    @Transactional
    public UserPreferencesResponse getCurrent() {
        UserPreferences prefs = loadOrCreateDefaults();
        return mapper.toResponse(prefs);
    }

    @Override
    @Transactional
    public UserPreferencesResponse updateCurrent(UpdateUserPreferencesRequest request) {
        UserPreferences prefs = loadOrCreateDefaults();
        if (request.analyticsRefreshIntervalSeconds() != null) {
            prefs.setAnalyticsRefreshIntervalSeconds(request.analyticsRefreshIntervalSeconds());
        }
        if (request.analyticsStreamingPaused() != null) {
            prefs.setAnalyticsStreamingPaused(request.analyticsStreamingPaused());
        }
        UserPreferences saved = preferencesRepository.save(prefs);
        return mapper.toResponse(saved);
    }

    private UserPreferences loadOrCreateDefaults() {
        String sub = TenantContext.getCurrentUserSub();
        User user = userRepository.findByCognitoSub(sub)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> preferencesRepository.save(
                        UserPreferences.builder()
                                .user(user)
                                .analyticsRefreshIntervalSeconds(5)
                                .analyticsStreamingPaused(false)
                                .build()));
    }
}
