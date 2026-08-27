package com.gastrack.security.cognito;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
public class CognitoJwtConfiguration {

    private final CognitoProperties cognitoProperties;

    @Bean
    public JwtDecoder jwtDecoder() {
        String userPoolId = cognitoProperties.getUserPoolId();
        if (userPoolId == null || userPoolId.isBlank()) {
            throw new IllegalStateException("aws.cognito.user-pool-id must be configured");
        }
        return NimbusJwtDecoder.withJwkSetUri(cognitoProperties.getJwkUrl()).build();
    }
}
