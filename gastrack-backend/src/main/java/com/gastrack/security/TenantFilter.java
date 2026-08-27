package com.gastrack.security;

import com.gastrack.model.User;
import com.gastrack.repository.UserRepository;
import com.gastrack.service.UserService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

/**
 * Filter that populates TenantContext after JWT authentication.
 * Retrieves user from database and sets company, role, and user sub.
 * Also handles first-login user creation from pending invitations.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(1)
public class TenantFilter implements Filter {

    private final UserRepository userRepository;
    private final UserService userService;

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws ServletException, IOException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;

        if (request.getRequestURI().startsWith("/api/v1/devices/")) {
            chain.doFilter(servletRequest, servletResponse);
            return;
        }

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                String userSub = extractUserSub(authentication);

                if (userSub != null) {
                    Optional<User> userOpt = userRepository.findByCognitoSub(userSub);

                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        populateTenantContext(user);
                        recordLoginIfNewer(authentication, user);
                    } else {
                        // User not found - try to create from pending invitation (first login)
                        String email = extractEmail(authentication);
                        if (email != null) {
                            Optional<User> newUser = userService.handleFirstLogin(userSub, email);
                            newUser.ifPresent(this::populateTenantContext);
                        } else {
                            log.warn("User not found and no email in JWT for sub: {}", userSub);
                        }
                    }
                }
            }

            chain.doFilter(servletRequest, servletResponse);

        } finally {
            // Always clear context at the end of the request
            TenantContext.clear();
        }
    }

    private void populateTenantContext(User user) {
        TenantContext.setCurrentUserId(user.getId());
        TenantContext.setCurrentUserSub(user.getCognitoSub());
        TenantContext.setCurrentUserRole(user.getRole());

        if (user.getCompany() != null) {
            TenantContext.setCurrentCompanyId(user.getCompany().getId());
        }

        // Update Spring Security authorities with role from database
        updateSecurityContextWithRole(user);

        log.debug("TenantContext populated - userId: {}, userSub: {}, role: {}, companyId: {}",
            user.getId(), user.getCognitoSub(), user.getRole(),
            user.getCompany() != null ? user.getCompany().getId() : "null");
    }

    /**
     * Updates the Spring Security context with the user's role from the database.
     * This ensures @PreAuthorize annotations work correctly with database-stored roles.
     */
    private void updateSecurityContextWithRole(User user) {
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth == null) {
            return;
        }

        // Create authority from database role
        List<GrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        // Create new authentication with updated authorities
        UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(
            currentAuth.getPrincipal(),
            currentAuth.getCredentials(),
            authorities
        );
        newAuth.setDetails(currentAuth.getDetails());

        SecurityContextHolder.getContext().setAuthentication(newAuth);
        log.debug("Updated SecurityContext with role: ROLE_{}", user.getRole().name());
    }

    /**
     * Records a login only when the JWT carries an auth_time newer than the user's
     * stored lastLoginAt. Uses the already-loaded user to decide, so the write to the
     * DB happens only on an actual new login, never on every request. In DEV the
     * principal is a String (Basic Auth) -> extractAuthTime returns null -> no-op.
     */
    private void recordLoginIfNewer(Authentication authentication, User user) {
        Instant authTime = extractAuthTime(authentication);
        if (authTime == null) {
            return;
        }

        LocalDateTime lastLogin = user.getLastLoginAt();
        LocalDateTime authLdt = LocalDateTime.ofInstant(authTime, ZoneOffset.UTC);

        if (lastLogin == null || authLdt.isAfter(lastLogin)) {
            userService.recordLogin(user.getCognitoSub(), authTime);
        }
    }

    private Instant extractAuthTime(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsInstant("auth_time");
        }
        // DEV: principal is a String (Basic Auth) -> no auth_time claim.
        return null;
    }

    private String extractUserSub(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            // Só o `sub`, sem cair para `cognito:username`: este valor é chave de identidade —
            // alimenta findByCognitoSub e, quando não acha, handleFirstLogin **cria** o usuário
            // com ele. `users.cognito_sub` guarda o UUID do Cognito, e o username neste pool é o
            // e-mail, então o fallback não resolveria busca nenhuma; só destravaria a criação de
            // um usuário fantasma, com papel e empresa vindos do convite (CONVENTIONS §11).
            return jwt.getSubject();
        }

        if (principal instanceof String) {
            // Could be username or sub from JWT filter
            return (String) principal;
        }

        return null;
    }

    private String extractEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            // Try different claims where email might be stored
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                return email;
            }

            // Cognito often stores email in username claim
            String username = jwt.getClaimAsString("username");
            if (username != null && username.contains("@")) {
                return username;
            }

            // Try cognito:username claim
            String cognitoUsername = jwt.getClaimAsString("cognito:username");
            if (cognitoUsername != null && cognitoUsername.contains("@")) {
                return cognitoUsername;
            }
        }

        // If principal is a string, it might be the email (username)
        if (principal instanceof String principalStr) {
            if (principalStr.contains("@")) {
                return principalStr;
            }
        }

        return null;
    }
}
