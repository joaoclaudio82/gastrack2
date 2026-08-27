package com.gastrack.security.cognito;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Utility component for calculating AWS Cognito secret hash.
 * The secret hash is required when using app client secret with Cognito.
 */
@Slf4j
@Component

@RequiredArgsConstructor
public class CognitoSecretHashCalculator {

    private final CognitoProperties cognitoProperties;

    /**
     * Calculate the secret hash for Cognito authentication.
     * Formula: Base64(HMAC_SHA256(username + clientId, clientSecret))
     *
     * @param username the username to calculate hash for
     * @return the calculated secret hash
     * @throws RuntimeException if hash calculation fails
     */
    public String calculateSecretHash(String username) {
        try {
            log.debug("Calculating secret hash for username: {}", username);

            String message = username + cognitoProperties.getClientId();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    cognitoProperties.getClientSecret().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(rawHmac);

        } catch (Exception e) {
            log.error("Error calculating secret hash: {}", e.getMessage(), e);
            throw new RuntimeException("Error calculating secret hash", e);
        }
    }
}
