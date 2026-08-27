package com.gastrack.mapper;

import com.gastrack.dto.CreateUserRequest;
import com.gastrack.dto.UpdateUserRequest;
import com.gastrack.dto.UserListResponse;
import com.gastrack.dto.UserResponse;
import com.gastrack.model.User;
import com.gastrack.model.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

/**
 * MapStruct mapper for User entity and DTOs.
 * Handles conversion between User entity and various response/request DTOs.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    /**
     * Convert User entity to full UserResponse DTO.
     *
     * @param user User entity
     * @return UserResponse DTO with all fields
     */
    @Mapping(target = "fullName", expression = "java(user.getFullName())")
    @Mapping(target = "role", source = "role", qualifiedByName = "roleToString")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    UserResponse toResponse(User user);

    /**
     * Convert list of User entities to list of UserResponse DTOs.
     *
     * @param users List of User entities
     * @return List of UserResponse DTOs
     */
    List<UserResponse> toResponseList(List<User> users);

    /**
     * Convert User entity to lightweight UserListResponse DTO.
     *
     * @param user User entity
     * @return UserListResponse DTO with essential fields only
     */
    @Mapping(target = "fullName", expression = "java(user.getFullName())")
    @Mapping(target = "role", source = "role", qualifiedByName = "roleToString")
    @Mapping(target = "companyName", source = "company.name")
    UserListResponse toListResponse(User user);

    /**
     * Convert list of User entities to list of UserListResponse DTOs.
     *
     * @param users List of User entities
     * @return List of UserListResponse DTOs
     */
    List<UserListResponse> toListResponseList(List<User> users);

    /**
     * Convert CreateUserRequest DTO to User entity.
     * Automatically sets active=true and role=USER.
     *
     * @param request CreateUserRequest DTO
     * @return New User entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "phoneVerified", ignore = true)
    @Mapping(target = "profilePictureUrl", ignore = true)
    @Mapping(target = "birthDate", ignore = true)
    @Mapping(target = "locale", ignore = true)
    @Mapping(target = "timezone", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "role", constant = "USER")
    User toEntity(CreateUserRequest request);

    /**
     * Update existing User entity with data from UpdateUserRequest.
     * Only updates non-null fields from the request.
     *
     * @param user    Existing User entity to update (will be modified)
     * @param request UpdateUserRequest DTO with new values
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cognitoSub", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "phoneVerified", ignore = true)
    void updateEntity(@MappingTarget User user, UpdateUserRequest request);

    /**
     * Convert UserRole enum to String.
     *
     * @param role UserRole enum
     * @return Role name as String, or null if role is null
     */
    @Named("roleToString")
    default String roleToString(UserRole role) {
        return role != null ? role.name() : null;
    }
}
