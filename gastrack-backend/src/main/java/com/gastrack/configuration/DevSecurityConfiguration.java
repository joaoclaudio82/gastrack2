package com.gastrack.configuration;

import com.gastrack.security.DeviceApiKeyFilter;
import com.gastrack.security.RateLimitFilter;
import com.gastrack.security.RequestLoggingFilter;
import com.gastrack.security.TenantFilter;
import com.gastrack.security.cognito.CognitoAuthenticationEntryPoint;
import com.gastrack.security.cognito.CognitoJwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.stream.Collectors;

import static org.springframework.security.config.Customizer.withDefaults;

/**
 * Segurança no perfil {@code dev}: JWT Cognito (mesma ordem de filtros que producao) + HTTP Basic opcional
 * para Swagger. Sem o filtro JWT, o frontend autenticado via Cognito recebia 401 nas APIs e parecia
 * "desligar" apos o login.
 */
@Configuration(proxyBeanMethods = false)
@Profile("dev")
@EnableMethodSecurity
@RequiredArgsConstructor
public class DevSecurityConfiguration {

    private final CognitoJwtAuthenticationFilter cognitoJwtAuthenticationFilter;
    private final CognitoAuthenticationEntryPoint cognitoAuthenticationEntryPoint;
    private final DeviceApiKeyFilter deviceApiKeyFilter;
    private final RateLimitFilter rateLimitFilter;
    private final RequestLoggingFilter requestLoggingFilter;
    private final TenantFilter tenantFilter;

    @Value("${dev.security.admin.username:#{null}}")
    private String adminUsername;

    @Value("${dev.security.admin.password:#{null}}")
    private String adminPassword;

    @Value("${dev.security.user.username:#{null}}")
    private String userUsername;

    @Value("${dev.security.user.password:#{null}}")
    private String userPassword;

    @Value("${security.cors.allowed-origins:http://localhost:3000,http://localhost:4200}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        if (!StringUtils.hasText(adminUsername) || !StringUtils.hasText(adminPassword) ||
            !StringUtils.hasText(userUsername) || !StringUtils.hasText(userPassword)) {
            throw new IllegalStateException(
                "Dev security credentials not configured. Please set: " +
                "dev.security.admin.username, dev.security.admin.password, " +
                "dev.security.user.username, dev.security.user.password"
            );
        }

        UserDetails admin = User.builder()
                .username(adminUsername)
                .password(passwordEncoder.encode(adminPassword))
                .roles("ADMIN", "USER")
                .build();

        UserDetails user = User.builder()
                .username(userUsername)
                .password(passwordEncoder.encode(userPassword))
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(admin, user);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(StringUtils::hasText)
                        .collect(Collectors.toList())
        );
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Device-Api-Key"));
        configuration.setMaxAge(3600L);
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(CsrfConfigurer::disable)
                .cors(withDefaults())
                .addFilterBefore(requestLoggingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(cognitoJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(deviceApiKeyFilter, cognitoJwtAuthenticationFilter.getClass())
                .addFilterAfter(tenantFilter, cognitoJwtAuthenticationFilter.getClass())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/**",
                                "/h2-console/**",
                                "/error"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handler -> handler.authenticationEntryPoint(cognitoAuthenticationEntryPoint))
                .httpBasic(withDefaults())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .build();
    }
}
