package com.gastrack.mapper;

import com.gastrack.dto.UserPreferencesResponse;
import com.gastrack.model.UserPreferences;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserPreferencesMapper {
    UserPreferencesResponse toResponse(UserPreferences entity);
}
