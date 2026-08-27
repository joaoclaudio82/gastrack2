package com.gastrack.service;

import com.gastrack.dto.UpdateUserPreferencesRequest;
import com.gastrack.dto.UserPreferencesResponse;

public interface UserPreferencesService {
    UserPreferencesResponse getCurrent();
    UserPreferencesResponse updateCurrent(UpdateUserPreferencesRequest request);
}
