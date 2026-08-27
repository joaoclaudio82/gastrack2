package com.gastrack.repository;

import com.gastrack.model.User;
import com.gastrack.model.UserRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity.
 *
 * Provides methods to find users by Cognito sub, email, and other criteria.
 * The cognitoSub is the primary way to link local users with Cognito users.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by Cognito sub (UUID from JWT 'sub' claim).
     * This is the primary lookup method after JWT validation.
     *
     * <p>A empresa vem no mesmo SELECT de propósito. O mapeamento da resposta de `/users/me`
     * roda no controller, fora da transação, e `open-in-view` é `false`: com a associação LAZY,
     * ler `company.getName()` estourava `LazyInitializationException` e devolvia 500 — só para
     * quem tem empresa, o que fez o defeito passar batido. Ler `getId()` de um proxy não o
     * inicializa, e é por isso que o TenantFilter nunca quebrou.
     *
     * @param cognitoSub the Cognito user sub (UUID)
     * @return Optional containing the user if found
     */
    @EntityGraph(attributePaths = "company")
    Optional<User> findByCognitoSub(String cognitoSub);

    /**
     * Find user by email address.
     *
     * @param email the email address
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Find user by username.
     *
     * @param username the username
     * @return Optional containing the user if found
     */
    Optional<User> findByUsername(String username);

    /**
     * Check if a user exists with the given Cognito sub.
     *
     * @param cognitoSub the Cognito user sub
     * @return true if user exists
     */
    boolean existsByCognitoSub(String cognitoSub);

    /**
     * Check if a user exists with the given email.
     *
     * @param email the email address
     * @return true if user exists
     */
    boolean existsByEmail(String email);

    /**
     * Find all active users.
     *
     * @return list of active users
     */
    List<User> findByActiveTrue();

    /**
     * Find all users by role.
     *
     * @param role the user role
     * @return list of users with the specified role
     */
    List<User> findByRole(UserRole role);

    /**
     * Find users by role with pagination support.
     *
     * @param role the user role
     * @param pageable pagination information
     * @return page of users with the specified role
     */
    Page<User> findByRole(UserRole role, Pageable pageable);

    /**
     * Find all active users by role.
     *
     * @param role the user role
     * @return list of active users with the specified role
     */
    List<User> findByRoleAndActiveTrue(UserRole role);

    /**
     * Update last login timestamp for a user.
     *
     * @param cognitoSub the Cognito user sub
     * @param lastLoginAt the login timestamp
     */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.lastLoginAt = :lastLoginAt WHERE u.cognitoSub = :cognitoSub")
    void updateLastLoginAt(@Param("cognitoSub") String cognitoSub, @Param("lastLoginAt") LocalDateTime lastLoginAt);

    /**
     * Deactivate a user by Cognito sub.
     *
     * @param cognitoSub the Cognito user sub
     */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.active = false WHERE u.cognitoSub = :cognitoSub")
    void deactivateByCognitoSub(@Param("cognitoSub") String cognitoSub);

    /**
     * Count users by role.
     *
     * @param role the user role
     * @return count of users with the specified role
     */
    long countByRole(UserRole role);

    /**
     * Count active users.
     *
     * @return count of active users
     */
    long countByActiveTrue();

    /**
     * Find all users by company.
     *
     * @param companyId the company ID
     * @return list of users in the specified company
     */
    List<User> findByCompanyId(Long companyId);

    /**
     * Find all active users by company.
     *
     * @param companyId the company ID
     * @return list of active users in the specified company
     */
    List<User> findByCompanyIdAndActiveTrue(Long companyId);

    /**
     * Count users in a company.
     *
     * @param companyId the company ID
     * @return count of users in the specified company
     */
    long countByCompanyId(Long companyId);

    /**
     * Find all users with pagination.
     *
     * @param pageable pagination information
     * @return page of users
     */
    Page<User> findAll(Pageable pageable);

    /**
     * Find all users by company with pagination.
     *
     * @param companyId the company ID
     * @param pageable pagination information
     * @return page of users in the specified company
     */
    Page<User> findByCompanyId(Long companyId, Pageable pageable);

    /**
     * Find users by company and role with pagination.
     *
     * @param companyId the company ID
     * @param role the user role
     * @param pageable pagination information
     * @return page of users matching both filters
     */
    Page<User> findByCompanyIdAndRole(Long companyId, UserRole role, Pageable pageable);
}
