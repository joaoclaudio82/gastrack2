package com.gastrack.service;

import com.gastrack.dto.invitation.CreateInvitationRequest;
import com.gastrack.dto.invitation.InvitationResponse;
import com.gastrack.model.InvitationStatus;
import com.gastrack.model.UserInvitation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * Service interface for user invitation operations.
 */
public interface InvitationService {

    /**
     * Creates a new invitation and sends it via Cognito.
     *
     * @param request the invitation details
     * @return the created invitation response
     */
    InvitationResponse createInvitation(CreateInvitationRequest request);

    /**
     * Lists all invitations visible to the current user.
     * ADMIN sees only their company's invitations.
     * SUPER_ADMIN sees all invitations.
     *
     * @param pageable pagination parameters
     * @return page of invitation responses
     */
    Page<InvitationResponse> listInvitations(Pageable pageable, InvitationStatus status);

    /**
     * Gets a specific invitation by ID.
     *
     * @param id the invitation ID
     * @return the invitation response
     */
    InvitationResponse getInvitation(Long id);

    /**
     * Cancels an invitation and removes the user from Cognito.
     *
     * @param id the invitation ID
     */
    void cancelInvitation(Long id);

    /**
     * Resends the invitation email.
     *
     * @param id the invitation ID
     * @return the updated invitation response
     */
    InvitationResponse resendInvitation(Long id);

    /**
     * Finds a pending invitation by email.
     * Used during first login to link the user to their invitation.
     *
     * @param email the email address
     * @return optional containing the invitation if found
     */
    Optional<UserInvitation> findPendingInvitationByEmail(String email);

    /**
     * Marks an invitation as accepted.
     *
     * @param invitation the invitation to mark as accepted
     */
    void markAsAccepted(UserInvitation invitation);
}
