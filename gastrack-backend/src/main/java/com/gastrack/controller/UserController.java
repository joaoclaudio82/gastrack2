package com.gastrack.controller;

import com.gastrack.dto.UpdateUserRequest;
import com.gastrack.dto.UserListResponse;
import com.gastrack.dto.UserResponse;
import com.gastrack.mapper.UserMapper;
import com.gastrack.model.User;
import com.gastrack.model.UserRole;
import com.gastrack.security.TenantContext;
import com.gastrack.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user management.
 * Multi-tenant: Regular users see only their company's users, super admin sees all.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
        summary = "List users",
        description = "List users with pagination. ADMIN sees company users, SUPER_ADMIN sees all users."
    )
    public ResponseEntity<Page<UserListResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(value = "role", required = false) UserRole role,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(userService.findAll(pageable, role, companyId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
        summary = "Get user by ID",
        description = "Get a specific user by ID. Access is validated based on company membership."
    )
    public ResponseEntity<UserResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userMapper.toResponse(userService.findById(id)));
    }

    @GetMapping("/me")
    @Operation(
        summary = "Get current user profile",
        description = "Get the authenticated user's profile information."
    )
    public ResponseEntity<UserResponse> getMyProfile() {
        String cognitoSub = TenantContext.getCurrentUserSub();
        User user = userService.findByCognitoSub(cognitoSub);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PutMapping("/me")
    @Operation(
        summary = "Update current user profile",
        description = "Update the authenticated user's profile information."
    )
    public ResponseEntity<UserResponse> updateMyProfile(@Valid @RequestBody UpdateUserRequest request) {
        String cognitoSub = TenantContext.getCurrentUserSub();
        var serviceRequest = com.gastrack.service.dto.UpdateUserRequest.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .locale(request.getLocale())
                .timezone(request.getTimezone())
                .profilePictureUrl(request.getProfilePictureUrl())
                .build();
        User updatedUser = userService.updateUser(cognitoSub, serviceRequest);
        return ResponseEntity.ok(userMapper.toResponse(updatedUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
        summary = "Deactivate user",
        description = "Deactivate a user by ID. ADMIN users can only manage users from their company."
    )
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
        userService.deactivateById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
        summary = "Activate user",
        description = "Reactivate a previously deactivated user. ADMIN users can only manage users from their company."
    )
    public ResponseEntity<UserListResponse> activateUser(@PathVariable Long id) {
        UserListResponse user = userService.activateById(id);
        return ResponseEntity.ok(user);
    }
}
