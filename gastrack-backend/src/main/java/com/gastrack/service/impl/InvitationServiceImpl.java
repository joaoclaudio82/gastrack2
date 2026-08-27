package com.gastrack.service.impl;

import com.gastrack.dto.invitation.CreateInvitationRequest;
import com.gastrack.dto.invitation.InvitationResponse;
import com.gastrack.exceptions.AccessDeniedException;
import com.gastrack.exceptions.BusinessException;
import com.gastrack.exceptions.ResourceNotFoundException;
import com.gastrack.mapper.InvitationMapper;
import com.gastrack.model.*;
import com.gastrack.repository.CompanyRepository;
import com.gastrack.repository.UserInvitationRepository;
import com.gastrack.repository.UserRepository;
import com.gastrack.security.TenantContext;
import com.gastrack.security.cognito.CognitoService;
import com.gastrack.security.cognito.dto.CognitoAdminCreateUserRequest;
import com.gastrack.security.cognito.dto.CognitoAdminCreateUserResponse;
import com.gastrack.service.InvitationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of InvitationService.
 * Handles user invitation operations including Cognito user creation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationServiceImpl implements InvitationService {

    private static final int INVITATION_EXPIRY_DAYS = 7;

    private final UserInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CognitoService cognitoService;
    private final InvitationMapper invitationMapper;

    @Override
    @Transactional
    public InvitationResponse createInvitation(CreateInvitationRequest request) {
        log.info("Creating invitation for email: {}", request.email());

        // Validate the role - only USER and ADMIN can be invited
        validateInvitableRole(request.role());

        // Get current user
        User currentUser = getCurrentUser();

        // Determine target company and validate permissions
        Company targetCompany = determineTargetCompany(request, currentUser);

        // Validate that admin can only create USER or ADMIN within their company
        validateInvitationPermissions(currentUser, request.role(), targetCompany);

        // Check if user already exists in the system
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("A user with this email already exists");
        }

        // Check for existing pending invitation
        if (invitationRepository.existsPendingByEmail(request.email())) {
            throw new BusinessException("A pending invitation already exists for this email");
        }

        // Create Cognito user
        CognitoAdminCreateUserResponse cognitoResponse = createCognitoUser(request);

        // Add user to Cognito group based on role
        addUserToRoleGroup(cognitoResponse.getUsername(), request.role());

        // Provision the local User immediately (sub is now known) to avoid the
        // JIT race on first login (bugs #35/#36). TenantFilter.handleFirstLogin
        // remains as an idempotent fallback.
        provisionLocalUser(cognitoResponse, request, targetCompany);

        // Create invitation record
        UserInvitation invitation = UserInvitation.builder()
                .email(request.email())
                .role(request.role())
                .company(targetCompany)
                .token(UUID.randomUUID().toString())
                .status(InvitationStatus.PENDING)
                .cognitoUsername(cognitoResponse.getUsername())
                .expiresAt(LocalDateTime.now().plusDays(INVITATION_EXPIRY_DAYS))
                .createdBy(currentUser)
                .build();

        UserInvitation saved = invitationRepository.save(invitation);
        log.info("Invitation created with id: {} for email: {}", saved.getId(), request.email());

        return invitationMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvitationResponse> listInvitations(Pageable pageable, InvitationStatus status) {
        Page<UserInvitation> invitations;

        if (TenantContext.isSuperAdmin()) {
            if (status != null) {
                invitations = invitationRepository.findByStatus(status, pageable);
            } else {
                invitations = invitationRepository.findAll(pageable);
            }
        } else {
            Long companyId = TenantContext.getCurrentCompanyId();
            if (companyId == null) {
                throw new AccessDeniedException("No company associated with current user");
            }
            if (status != null) {
                invitations = invitationRepository.findByCompanyIdAndStatus(companyId, status, pageable);
            } else {
                invitations = invitationRepository.findByCompanyId(companyId, pageable);
            }
        }

        return invitations.map(invitationMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public InvitationResponse getInvitation(Long id) {
        UserInvitation invitation = findInvitationWithAccessCheck(id);
        return invitationMapper.toResponse(invitation);
    }

    @Override
    @Transactional
    public void cancelInvitation(Long id) {
        UserInvitation invitation = findInvitationWithAccessCheck(id);

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException("Only pending invitations can be cancelled");
        }

        // Delete user from Cognito
        if (invitation.getCognitoUsername() != null) {
            try {
                cognitoService.adminDeleteUser(invitation.getCognitoUsername());
            } catch (Exception e) {
                log.warn("Failed to delete Cognito user during invitation cancellation: {}", e.getMessage());
                // Continue with cancellation even if Cognito deletion fails
            }
        }

        invitation.cancel();
        invitationRepository.save(invitation);

        log.info("Invitation {} cancelled for email: {}", id, invitation.getEmail());
    }

    @Override
    @Transactional
    public InvitationResponse resendInvitation(Long id) {
        UserInvitation invitation = findInvitationWithAccessCheck(id);

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException("Only pending invitations can be resent");
        }

        // Resend invitation via Cognito using email (cognitoUsername is a UUID, not email)
        if (invitation.getCognitoUsername() != null) {
            cognitoService.adminResendInvitation(invitation.getEmail());
        } else {
            throw new BusinessException("Invitation has no associated Cognito user");
        }

        // Update expiration date
        invitation.setExpiresAt(LocalDateTime.now().plusDays(INVITATION_EXPIRY_DAYS));
        UserInvitation saved = invitationRepository.save(invitation);

        log.info("Invitation {} resent for email: {}", id, invitation.getEmail());

        return invitationMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserInvitation> findPendingInvitationByEmail(String email) {
        return invitationRepository.findPendingByEmail(email);
    }

    @Override
    @Transactional
    public void markAsAccepted(UserInvitation invitation) {
        invitation.accept();
        invitationRepository.save(invitation);
        log.info("Invitation {} marked as accepted for email: {}", invitation.getId(), invitation.getEmail());
    }

    // ==================== Private Helper Methods ====================

    private void validateInvitableRole(UserRole role) {
        if (role == UserRole.SUPER_ADMIN) {
            throw new BusinessException("Cannot invite users with SUPER_ADMIN role");
        }
    }

    private User getCurrentUser() {
        String userSub = TenantContext.getCurrentUserSub();
        if (userSub == null) {
            throw new AccessDeniedException("No authenticated user found");
        }

        return userRepository.findByCognitoSub(userSub)
                .orElseThrow(() -> new AccessDeniedException("Current user not found in database"));
    }

    private Company determineTargetCompany(CreateInvitationRequest request, User currentUser) {
        if (TenantContext.isSuperAdmin()) {
            // SUPER_ADMIN must specify company
            if (request.companyId() == null) {
                throw new BusinessException("Company ID is required for SUPER_ADMIN invitations");
            }
            return companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company", "id", request.companyId()));
        } else {
            // ADMIN uses their own company
            if (currentUser.getCompany() == null) {
                throw new AccessDeniedException("Current user has no company assigned");
            }
            return currentUser.getCompany();
        }
    }

    private void validateInvitationPermissions(User currentUser, UserRole targetRole, Company targetCompany) {
        UserRole currentRole = TenantContext.getCurrentUserRole();

        // SUPER_ADMIN can invite any role to any company (except SUPER_ADMIN)
        if (currentRole == UserRole.SUPER_ADMIN) {
            return;
        }

        // ADMIN can only invite USER or ADMIN
        if (currentRole == UserRole.ADMIN) {
            if (targetRole != UserRole.USER && targetRole != UserRole.ADMIN) {
                throw new AccessDeniedException("ADMIN can only invite USER or ADMIN roles");
            }
            // ADMIN can only invite to their own company
            if (!targetCompany.getId().equals(currentUser.getCompany().getId())) {
                throw new AccessDeniedException("ADMIN can only invite users to their own company");
            }
            return;
        }

        // USER cannot invite anyone
        throw new AccessDeniedException("You do not have permission to create invitations");
    }

    private CognitoAdminCreateUserResponse createCognitoUser(CreateInvitationRequest request) {
        CognitoAdminCreateUserRequest cognitoRequest = CognitoAdminCreateUserRequest.builder()
                .email(request.email())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .sendEmail(true)
                .build();

        return cognitoService.adminCreateUser(cognitoRequest);
    }

    private void addUserToRoleGroup(String username, UserRole role) {
        try {
            cognitoService.adminAddUserToGroup(username, role.name());
            log.info("User {} added to Cognito group {}", username, role.name());
        } catch (Exception e) {
            // If adding to group fails, we should delete the Cognito user to maintain consistency
            log.error("Failed to add user {} to group {}. Rolling back user creation.", username, role.name());
            try {
                cognitoService.adminDeleteUser(username);
            } catch (Exception deleteEx) {
                log.error("Failed to rollback Cognito user creation: {}", deleteEx.getMessage());
            }
            throw new BusinessException("Failed to assign role to user. Please ensure the group '" + role.name() + "' exists in Cognito.");
        }
    }

    /**
     * Creates the local User right after the Cognito user exists, so the row is
     * present before the invited user's first request. Idempotent on cognitoSub:
     * if the User already exists it is left untouched.
     */
    private void provisionLocalUser(CognitoAdminCreateUserResponse cognitoResponse,
                                    CreateInvitationRequest request, Company targetCompany) {
        String cognitoSub = cognitoResponse.getUserSub();
        if (cognitoSub == null || userRepository.existsByCognitoSub(cognitoSub)) {
            return;
        }

        User user = User.builder()
                .cognitoSub(cognitoSub)
                .email(request.email())
                .username(request.email())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(request.role())
                .company(targetCompany)
                .active(true)
                .build();

        userRepository.save(user);
        log.info("Provisioned local user for invited email: {} (sub: {})", request.email(), cognitoSub);
    }

    private UserInvitation findInvitationWithAccessCheck(Long id) {
        UserInvitation invitation;

        if (TenantContext.isSuperAdmin()) {
            invitation = invitationRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", id));
        } else {
            Long companyId = TenantContext.getCurrentCompanyId();
            if (companyId == null) {
                throw new AccessDeniedException("No company associated with current user");
            }
            invitation = invitationRepository.findByIdAndCompanyId(id, companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", id));
        }

        return invitation;
    }
}
