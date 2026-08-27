package com.gastrack.repository;

import com.gastrack.model.InvitationStatus;
import com.gastrack.model.UserInvitation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for UserInvitation entity.
 */
@Repository
public interface UserInvitationRepository extends JpaRepository<UserInvitation, Long> {

    /**
     * Find invitation by token.
     */
    Optional<UserInvitation> findByToken(String token);

    /**
     * Find invitation by email and status.
     */
    Optional<UserInvitation> findByEmailAndStatus(String email, InvitationStatus status);

    /**
     * Find pending invitation by email.
     */
    default Optional<UserInvitation> findPendingByEmail(String email) {
        return findByEmailAndStatus(email, InvitationStatus.PENDING);
    }

    /**
     * Check if a pending invitation exists for the email.
     */
    boolean existsByEmailAndStatus(String email, InvitationStatus status);

    /**
     * Check if a pending invitation exists for the email.
     */
    default boolean existsPendingByEmail(String email) {
        return existsByEmailAndStatus(email, InvitationStatus.PENDING);
    }

    /**
     * Find all invitations by company with pagination.
     */
    Page<UserInvitation> findByCompanyId(Long companyId, Pageable pageable);

    /**
     * Find all invitations by company and status with pagination.
     */
    Page<UserInvitation> findByCompanyIdAndStatus(Long companyId, InvitationStatus status, Pageable pageable);

    /**
     * Find all invitations by status with pagination.
     */
    Page<UserInvitation> findByStatus(InvitationStatus status, Pageable pageable);

    /**
     * Find all expired pending invitations.
     */
    @Query("SELECT i FROM UserInvitation i WHERE i.status = 'PENDING' AND i.expiresAt < :now")
    List<UserInvitation> findExpiredPendingInvitations(@Param("now") LocalDateTime now);

    /**
     * Mark expired invitations as EXPIRED.
     */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE UserInvitation i SET i.status = 'EXPIRED' WHERE i.status = 'PENDING' AND i.expiresAt < :now")
    int markExpiredInvitations(@Param("now") LocalDateTime now);

    /**
     * Count invitations by company and status.
     */
    long countByCompanyIdAndStatus(Long companyId, InvitationStatus status);

    /**
     * Count pending invitations for a company.
     */
    default long countPendingByCompanyId(Long companyId) {
        return countByCompanyIdAndStatus(companyId, InvitationStatus.PENDING);
    }

    /**
     * Find invitation by id and company.
     */
    Optional<UserInvitation> findByIdAndCompanyId(Long id, Long companyId);

    /**
     * Find pending invitation by Cognito username (SUB).
     */
    Optional<UserInvitation> findByCognitoUsernameAndStatus(String cognitoUsername, InvitationStatus status);

    /**
     * Find pending invitation by Cognito username (SUB).
     */
    default Optional<UserInvitation> findPendingByCognitoUsername(String cognitoUsername) {
        return findByCognitoUsernameAndStatus(cognitoUsername, InvitationStatus.PENDING);
    }
}
