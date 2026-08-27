package com.gastrack.mapper;

import com.gastrack.dto.AuthResponse;
import com.gastrack.dto.UserResponse;
import com.gastrack.security.cognito.dto.CognitoAuthResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for Cognito DTOs.
 * Handles conversion between Cognito responses and application DTOs.
 */
@Mapper(componentModel = "spring")
public interface CognitoMapper {

    /**
     * Convert CognitoAuthResponse to AuthResponse.
     * User field will be null and should be set separately.
     *
     * @param cognitoResponse Cognito authentication response
     * @return AuthResponse DTO
     */
    @Mapping(target = "user", ignore = true)
    AuthResponse toAuthResponse(CognitoAuthResponse cognitoResponse);

    /**
     * Convert CognitoAuthResponse to AuthResponse with user data.
     *
     * @param cognitoResponse Cognito authentication response
     * @param user            User data to include in response
     * @return AuthResponse DTO with tokens and user data
     */
    default AuthResponse toAuthResponseWithUser(CognitoAuthResponse cognitoResponse, UserResponse user) {
        AuthResponse response = toAuthResponse(cognitoResponse);
        response.setUser(user);
        return response;
    }
}
