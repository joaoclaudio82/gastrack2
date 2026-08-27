package com.gastrack.model;

/**
 * Status of a user invitation.
 */
public enum InvitationStatus {

    /**
     * Invitation has been sent and is awaiting user action.
     */
    PENDING,

    /**
     * User has accepted the invitation and completed registration.
     */
    ACCEPTED,

    /**
     * Invitation was cancelled by an admin.
     */
    CANCELLED,

    /**
     * Invitation has expired (past expiration date).
     */
    EXPIRED
}
