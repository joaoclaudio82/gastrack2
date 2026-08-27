package com.gastrack.security.cognito;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

/**
 * Factory for creating AWS Cognito Identity Provider clients.
 * Centralizes client configuration and creation.
 */
@Slf4j
@Component

@RequiredArgsConstructor
public class CognitoClientFactory {

    private final CognitoProperties cognitoProperties;

    /**
     * Creates a new CognitoIdentityProviderClient instance.
     * Clients should be used in try-with-resources blocks to ensure proper cleanup.
     *
     * @return a new CognitoIdentityProviderClient
     */
    public CognitoIdentityProviderClient createClient() {
        log.debug("Creating Cognito Identity Provider client for region: {}", cognitoProperties.getRegion());

        return CognitoIdentityProviderClient.builder()
                .region(Region.of(cognitoProperties.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
