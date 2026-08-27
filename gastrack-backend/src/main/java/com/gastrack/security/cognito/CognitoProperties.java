package com.gastrack.security.cognito;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component

@ConfigurationProperties(prefix = "aws.cognito")
public class CognitoProperties {

    private String region;
    private String userPoolId;
    private String clientId;
    private String clientSecret;
    private String domain;

    public String getJwkUrl() {
        return String.format("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", region, userPoolId);
    }

    public String getIssuerUri() {
        return String.format("https://cognito-idp.%s.amazonaws.com/%s", region, userPoolId);
    }

    public String getTokenUrl() {
        return String.format("https://%s.auth.%s.amazoncognito.com/oauth2/token", domain, region);
    }

    public String getAuthorizeUrl() {
        return String.format("https://%s.auth.%s.amazoncognito.com/oauth2/authorize", domain, region);
    }

    public String getUserInfoUrl() {
        return String.format("https://%s.auth.%s.amazoncognito.com/oauth2/userInfo", domain, region);
    }
}
