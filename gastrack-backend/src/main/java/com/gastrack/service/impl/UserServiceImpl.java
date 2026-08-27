package com.gastrack.service.impl;

import com.gastrack.dto.UserListResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.UserAlreadyExistsException;
import com.gastrack.exceptions.UserNotFoundException;
import com.gastrack.mapper.UserMapper;
import com.gastrack.model.User;
import com.gastrack.model.UserInvitation;
import com.gastrack.model.UserRole;
import com.gastrack.repository.UserInvitationRepository;
import com.gastrack.repository.UserRepository;
import com.gastrack.service.TenantSecurityService;
import com.gastrack.service.UserService;
import com.gastrack.service.dto.UpdateUserRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

/**
 * Implementation of UserService for managing user entities.
 * Handles CRUD operations for users linked to AWS Cognito.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserInvitationRepository invitationRepository;
    private final UserMapper userMapper;
    private final TenantSecurityService tenantSecurityService;

    @Override
    @Transactional(readOnly = true)
    public User findByCognitoSub(String cognitoSub) {
        log.debug("Finding user by Cognito sub: {}", cognitoSub);
        return userRepository.findByCognitoSub(cognitoSub)
                .orElseThrow(() -> UserNotFoundException.byCognitoSub(cognitoSub));
    }

    @Override
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        log.debug("Finding user by email: {}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> UserNotFoundException.byEmail(email));
    }

    @Override
    @Transactional
    public User createUser(String cognitoSub, String email, String firstName, String lastName, String phoneNumber) {
        log.info("Creating user with Cognito sub: {}", cognitoSub);

        // Check if user already exists
        if (userRepository.existsByCognitoSub(cognitoSub)) {
            log.warn("User already exists with Cognito sub: {}", cognitoSub);
            throw UserAlreadyExistsException.byCognitoSub(cognitoSub);
        }

        if (userRepository.existsByEmail(email)) {
            log.warn("User already exists with email: {}", email);
            throw UserAlreadyExistsException.byEmail(email);
        }

        // Create new user
        User user = User.builder()
                .cognitoSub(cognitoSub)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .phoneNumber(phoneNumber)
                .role(UserRole.USER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {}", savedUser.getId());

        return savedUser;
    }

    @Override
    @Transactional
    public User updateUser(String cognitoSub, UpdateUserRequest request) {
        log.info("Updating user with Cognito sub: {}", cognitoSub);

        User user = findByCognitoSub(cognitoSub);

        // Update only non-null fields
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getLocale() != null) {
            user.setLocale(request.getLocale());
        }
        if (request.getTimezone() != null) {
            user.setTimezone(request.getTimezone());
        }
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully: {}", updatedUser.getId());

        return updatedUser;
    }

    @Override
    @Transactional
    public void updateLastLogin(String cognitoSub) {
        log.debug("Updating last login for Cognito sub: {}", cognitoSub);

        if (!userRepository.existsByCognitoSub(cognitoSub)) {
            log.warn("Cannot update last login - user not found with Cognito sub: {}", cognitoSub);
            throw UserNotFoundException.byCognitoSub(cognitoSub);
        }

        userRepository.updateLastLoginAt(cognitoSub, LocalDateTime.now());
        log.debug("Last login updated for Cognito sub: {}", cognitoSub);
    }

    @Override
    @Transactional
    public void recordLogin(String cognitoSub, Instant authTime) {
        if (authTime == null) {
            return;
        }

        User user = userRepository.findByCognitoSub(cognitoSub)
                .orElseThrow(() -> UserNotFoundException.byCognitoSub(cognitoSub));

        LocalDateTime authLdt = LocalDateTime.ofInstant(authTime, ZoneOffset.UTC);

        // Already recorded this login (same Cognito session) -> no-op, no write.
        if (user.getLastLoginAt() != null && !authLdt.isAfter(user.getLastLoginAt())) {
            return;
        }

        boolean firstLogin = user.getLastLoginAt() == null;
        user.setLastLoginAt(authLdt);
        userRepository.save(user);

        if (firstLogin) {
            invitationRepository.findPendingByEmail(user.getEmail())
                    .ifPresent(inv -> {
                        inv.accept();
                        invitationRepository.save(inv);
                    });
        }
        log.debug("Login recorded for Cognito sub: {} at {} (firstLogin={})", cognitoSub, authLdt, firstLogin);
    }

    @Override
    @Transactional
    public void deactivateUser(String cognitoSub) {
        log.info("Deactivating user with Cognito sub: {}", cognitoSub);

        if (!userRepository.existsByCognitoSub(cognitoSub)) {
            log.warn("Cannot deactivate - user not found with Cognito sub: {}", cognitoSub);
            throw UserNotFoundException.byCognitoSub(cognitoSub);
        }

        userRepository.deactivateByCognitoSub(cognitoSub);
        log.info("User deactivated successfully: {}", cognitoSub);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByCognitoSub(String cognitoSub) {
        log.debug("Checking if user exists with Cognito sub: {}", cognitoSub);
        return userRepository.existsByCognitoSub(cognitoSub);
    }

    @Override
    @Transactional
    public void deactivateById(Long id) {
        log.info("Deactivating user with ID: {}", id);

        User user = loadUserForManagement(id);

        if (Boolean.FALSE.equals(user.getActive())) {
            log.debug("User {} is already inactive", id);
            return;
        }

        user.setActive(false);
        userRepository.save(user);
        log.info("User {} deactivated successfully", id);
    }

    @Override
    @Transactional
    public UserListResponse activateById(Long id) {
        log.info("Activating user with ID: {}", id);

        User user = loadUserForManagement(id);

        if (Boolean.TRUE.equals(user.getActive())) {
            log.debug("User {} is already active", id);
            return userMapper.toListResponse(user);
        }

        user.setActive(true);
        User saved = userRepository.save(user);
        log.info("User {} activated successfully", id);
        return userMapper.toListResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserListResponse> findAll(Pageable pageable, UserRole roleFilter, Long companyFilter) {
        log.debug("Finding all users with pagination. roleFilter={}, companyFilter={}", roleFilter, companyFilter);

        Page<User> usersPage;

        if (tenantSecurityService.isSuperAdmin()) {
            usersPage = findForSuperAdmin(pageable, roleFilter, companyFilter);
        } else {
            Long companyId = tenantSecurityService.requireCompanyContext();
            log.debug("Non super admin access - restricting to company {}", companyId);
            usersPage = findForCompany(pageable, companyId, roleFilter);
        }

        return usersPage.map(userMapper::toListResponse);
    }

    private Page<User> findForSuperAdmin(Pageable pageable, UserRole roleFilter, Long companyFilter) {
        if (companyFilter != null && roleFilter != null) {
            log.debug("Super admin filtering by company {} and role {}", companyFilter, roleFilter);
            return userRepository.findByCompanyIdAndRole(companyFilter, roleFilter, pageable);
        }

        if (companyFilter != null) {
            log.debug("Super admin filtering by company {}", companyFilter);
            return userRepository.findByCompanyId(companyFilter, pageable);
        }

        if (roleFilter != null) {
            log.debug("Super admin filtering by role {}", roleFilter);
            return userRepository.findByRole(roleFilter, pageable);
        }

        log.debug("Super admin no filters - returning all users");
        return userRepository.findAll(pageable);
    }

    private Page<User> findForCompany(Pageable pageable, Long companyId, UserRole roleFilter) {
        if (roleFilter != null) {
            log.debug("Filtering company {} users by role {}", companyId, roleFilter);
            return userRepository.findByCompanyIdAndRole(companyId, roleFilter, pageable);
        }

        log.debug("Filtering users only by company {}", companyId);
        return userRepository.findByCompanyId(companyId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public User findById(Long id) {
        log.debug("Finding user by ID: {}", id);

        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        // Validate access - super admin can access any user, regular users only their company
        if (!tenantSecurityService.isSuperAdmin()) {
            Long companyId = tenantSecurityService.getCurrentCompanyIdOrNull();
            if (companyId == null || !companyId.equals(user.getCompany() != null ? user.getCompany().getId() : null)) {
                throw new com.gastrack.exceptions.AccessDeniedException("Access denied to this user");
            }
        }

        return user;
    }

    @Override
    @Transactional
    public Optional<User> handleFirstLogin(String cognitoSub, String email) {
        log.info("Handling first login for email: {}", email);

        // Idempotent fallback: user may already have been provisioned at invitation
        // creation time (bugs #35/#36). If so, reuse it instead of creating a duplicate.
        Optional<User> existing = userRepository.findByCognitoSub(cognitoSub);
        if (existing.isPresent()) {
            log.debug("User already provisioned for sub {}, skipping first-login creation", cognitoSub);
            return existing;
        }

        // Find pending invitation
        Optional<UserInvitation> invitationOpt = invitationRepository.findPendingByEmail(email);

        if (invitationOpt.isEmpty()) {
            log.warn("No pending invitation found for email: {}", email);
            return Optional.empty();
        }

        UserInvitation invitation = invitationOpt.get();

        // Check if invitation has expired
        if (invitation.isExpired()) {
            log.warn("Invitation expired for email: {}", email);
            invitation.expire();
            invitationRepository.save(invitation);
            return Optional.empty();
        }

        // Create local user from invitation
        User newUser = User.builder()
                .cognitoSub(cognitoSub)
                .email(email)
                .username(email)
                .role(invitation.getRole())
                .company(invitation.getCompany())
                .active(true)
                .lastLoginAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Created local user {} from invitation for email: {}", savedUser.getId(), email);

        // Mark invitation as accepted
        invitation.accept();
        invitationRepository.save(invitation);

        return Optional.of(savedUser);
    }

    private User loadUserForManagement(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        if (UserRole.SUPER_ADMIN.equals(user.getRole()) && !tenantSecurityService.isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can manage other super admins");
        }

        if (!tenantSecurityService.isSuperAdmin()) {
            Long currentCompanyId = tenantSecurityService.requireCompanyContext();
            Long userCompanyId = user.getCompany() != null ? user.getCompany().getId() : null;
            if (userCompanyId == null || !userCompanyId.equals(currentCompanyId)) {
                throw new AccessDeniedException("Cannot manage users from another company");
            }
        }

        return user;
    }
}
