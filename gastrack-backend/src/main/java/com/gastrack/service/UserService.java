package com.gastrack.service;

import com.gastrack.dto.UserListResponse;
import com.gastrack.model.User;
import com.gastrack.model.UserRole;
import com.gastrack.service.dto.UpdateUserRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for user management operations.
 * Provides methods for CRUD operations on users linked to AWS Cognito.
 */
public interface UserService {

    /**
     * Find a user by their Cognito sub (UUID).
     * This is the primary method to retrieve users after JWT authentication.
     *
     * @param cognitoSub the Cognito user sub from JWT token
     * @return the user entity
     * @throws com.gastrack.exceptions.UserNotFoundException if user not found
     */
    User findByCognitoSub(String cognitoSub);

    /**
     * Find a user by email address.
     *
     * @param email the user's email
     * @return the user entity
     * @throws com.gastrack.exceptions.UserNotFoundException if user not found
     */
    User findByEmail(String email);

    /**
     * Create a new user in the local database.
     * This should be called after successful Cognito registration.
     *
     * @param cognitoSub the Cognito user sub (UUID)
     * @param email the user's email
     * @param firstName the user's first name
     * @param lastName the user's last name
     * @param phoneNumber the user's phone number (optional)
     * @return the created user entity
     * @throws com.gastrack.exceptions.UserAlreadyExistsException if user already exists
     */
    User createUser(String cognitoSub, String email, String firstName, String lastName, String phoneNumber);

    /**
     * Update user information.
     *
     * @param cognitoSub the Cognito user sub
     * @param request the update request containing new values
     * @return the updated user entity
     * @throws com.gastrack.exceptions.UserNotFoundException if user not found
     */
    User updateUser(String cognitoSub, UpdateUserRequest request);

    /**
     * Update the last login timestamp for a user.
     * Should be called after successful authentication.
     *
     * @param cognitoSub the Cognito user sub
     */
    void updateLastLogin(String cognitoSub);

    /**
     * Record a login derived from the JWT 'auth_time' claim (no extra AWS call).
     * No-op when authTime is not newer than the stored lastLoginAt (same session).
     * On the very first login (lastLoginAt was null), flips the pending
     * invitation for the user's email from PENDING to ACCEPTED.
     *
     * @param cognitoSub the Cognito user sub
     * @param authTime the JWT auth_time claim (login instant)
     */
    void recordLogin(String cognitoSub, java.time.Instant authTime);

    /**
     * Deactivate a user account (soft delete).
     * The user remains in the database but is marked as inactive.
     *
     * @param cognitoSub the Cognito user sub
     */
    void deactivateUser(String cognitoSub);

    /**
     * Deactivate a user by ID (admin operation).
     *
     * @param id the user ID
     */
    void deactivateById(Long id);

    /**
     * Activate (reactivate) a user by ID (admin operation).
     *
     * @param id the user ID
     * @return the updated user list DTO
     */
    UserListResponse activateById(Long id);

    /**
     * Check if a user exists with the given Cognito sub.
     *
     * @param cognitoSub the Cognito user sub
     * @return true if user exists, false otherwise
     */
    boolean existsByCognitoSub(String cognitoSub);

    /**
     * Find all users with pagination.
     * Multi-tenant: Super admin sees all users, regular users see only their company's users.
     *
     * @param pageable pagination information
     * @return page of users
     */
    Page<UserListResponse> findAll(Pageable pageable, UserRole roleFilter, Long companyFilter);

    /**
     * Find a user by ID.
     *
     * @param id the user ID
     * @return the user entity
     * @throws com.gastrack.exceptions.UserNotFoundException if user not found
     */
    User findById(Long id);

    /**
     * Handle first login by creating a local user from a pending invitation.
     * This is called when a user exists in Cognito but not in the local database.
     *
     * @param cognitoSub the Cognito user sub from JWT token
     * @param email the user's email from JWT token
     * @return the created user if invitation found, empty otherwise
     */
    java.util.Optional<User> handleFirstLogin(String cognitoSub, String email);
}
