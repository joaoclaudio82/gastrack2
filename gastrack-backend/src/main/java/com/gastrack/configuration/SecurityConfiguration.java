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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security Configuration with AWS Cognito JWT Authentication
 * Active in production (default) - disabled in dev profile
 */
@Configuration
@Profile("!dev")
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

	private final CognitoJwtAuthenticationFilter cognitoJwtAuthenticationFilter;

	private final CognitoAuthenticationEntryPoint cognitoAuthenticationEntryPoint;

	private final DeviceApiKeyFilter deviceApiKeyFilter;

	private final RateLimitFilter rateLimitFilter;

	private final RequestLoggingFilter requestLoggingFilter;

	private final TenantFilter tenantFilter;

	@Value("${security.cors.allowed-origins:http://localhost:3000}")
	private String allowedOrigins;

	@Value("${security.require-https:false}")
	private boolean requireHttps;

	@Value("${springdoc.swagger-ui.enabled:false}")
	private boolean swaggerEnabled;

	@Bean
	public AuthenticationManager authenticationManager(final AuthenticationConfiguration authenticationConfiguration) {
		return authenticationConfiguration.getAuthenticationManager();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Device-Api-Key"));
		configuration.setMaxAge(3600L);
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

		//@formatter:off

		HttpSecurity httpSecurity = http
				.csrf(CsrfConfigurer::disable)
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.addFilterBefore(requestLoggingFilter, UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(cognitoJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(deviceApiKeyFilter, cognitoJwtAuthenticationFilter.getClass())
				.addFilterAfter(tenantFilter, cognitoJwtAuthenticationFilter.getClass())
				.authorizeHttpRequests(request -> {
					request.requestMatchers("/api/v1/auth/**", "/api/v1/devices/**", "/actuator/health/**", "/actuator/health", "/actuator/info", "/error").permitAll();

					if (swaggerEnabled) {
						request.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
					}

					request.requestMatchers("/actuator/**").hasRole("ADMIN")
						   .anyRequest().authenticated();
				})
				.sessionManagement(manager -> manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(handler -> handler.authenticationEntryPoint(cognitoAuthenticationEntryPoint))
				.headers(headers -> headers
						.frameOptions(frame -> frame.deny())
						.contentTypeOptions(contentType -> {})
						.httpStrictTransportSecurity(hsts -> hsts
								.includeSubDomains(true)
								.maxAgeInSeconds(31536000))
						.contentSecurityPolicy(csp -> csp
								.policyDirectives("default-src 'self'; frame-ancestors 'none'")));

		if (requireHttps) {
			httpSecurity.requiresChannel(channel -> channel.anyRequest().requiresSecure());
		}

		return httpSecurity.build();

		//@formatter:on
	}

}
