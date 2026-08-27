package com.gastrack.security.cognito;

import com.gastrack.security.utils.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.logging.log4j.util.Strings;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Component

@RequiredArgsConstructor
public class CognitoJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtDecoder;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        final String header = request.getHeader(SecurityConstants.HEADER_STRING);

        if (Objects.isNull(header) || !header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        final String token = header.replace(SecurityConstants.TOKEN_PREFIX, Strings.EMPTY);

        try {
            final Jwt jwt = jwtDecoder.decode(token);
            final SecurityContext securityContext = SecurityContextHolder.getContext();

            if (Objects.isNull(securityContext.getAuthentication())) {
                final String username = extractUsername(jwt);
                final List<SimpleGrantedAuthority> authorities = extractAuthorities(jwt);

                // Pass Jwt as principal so downstream filters can access claims (email, etc.)
                final UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(jwt, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                securityContext.setAuthentication(authentication);
                log.info("Cognito authentication successful. Username: {}", username);
            }

        } catch (JwtException e) {
            log.error("Cognito JWT validation failed: {}", e.getMessage());
        }

        chain.doFilter(request, response);
    }

    private String extractUsername(Jwt jwt) {
        // Cognito pode usar diferentes claims para username
        String username = jwt.getClaimAsString("cognito:username");
        if (Strings.isBlank(username)) {
            username = jwt.getClaimAsString("username");
        }
        if (Strings.isBlank(username)) {
            username = jwt.getClaimAsString("email");
        }
        if (Strings.isBlank(username)) {
            username = jwt.getSubject();
        }
        return username;
    }

    @SuppressWarnings("unchecked")
    private List<SimpleGrantedAuthority> extractAuthorities(Jwt jwt) {
        // Extrair grupos do Cognito como roles
        List<String> groups = jwt.getClaimAsStringList("cognito:groups");

        if (Objects.isNull(groups) || groups.isEmpty()) {
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return groups.stream()
                .map(group -> new SimpleGrantedAuthority("ROLE_" + group.toUpperCase()))
                .collect(Collectors.toList());
    }
}
