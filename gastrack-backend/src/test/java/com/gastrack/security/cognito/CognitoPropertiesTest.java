package com.gastrack.security.cognito;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CognitoProperties Tests")
class CognitoPropertiesTest {

    private CognitoProperties cognitoProperties;

    private static final String TEST_REGION = "us-east-1";
    private static final String TEST_USER_POOL_ID = "us-east-1_ABC123XYZ";
    private static final String TEST_CLIENT_ID = "test-client-id-123";
    private static final String TEST_CLIENT_SECRET = "test-client-secret-456";
    private static final String TEST_DOMAIN = "my-app-domain";

    @BeforeEach
    void setUp() {
        cognitoProperties = new CognitoProperties();
        cognitoProperties.setRegion(TEST_REGION);
        cognitoProperties.setUserPoolId(TEST_USER_POOL_ID);
        cognitoProperties.setClientId(TEST_CLIENT_ID);
        cognitoProperties.setClientSecret(TEST_CLIENT_SECRET);
        cognitoProperties.setDomain(TEST_DOMAIN);
    }

    @Test
    @DisplayName("should_SetAndGetRegion_When_PropertyProvided")
    void should_SetAndGetRegion_When_PropertyProvided() {
        // When
        String region = cognitoProperties.getRegion();

        // Then
        assertThat(region).isEqualTo(TEST_REGION);
    }

    @Test
    @DisplayName("should_SetAndGetUserPoolId_When_PropertyProvided")
    void should_SetAndGetUserPoolId_When_PropertyProvided() {
        // When
        String userPoolId = cognitoProperties.getUserPoolId();

        // Then
        assertThat(userPoolId).isEqualTo(TEST_USER_POOL_ID);
    }

    @Test
    @DisplayName("should_SetAndGetClientId_When_PropertyProvided")
    void should_SetAndGetClientId_When_PropertyProvided() {
        // When
        String clientId = cognitoProperties.getClientId();

        // Then
        assertThat(clientId).isEqualTo(TEST_CLIENT_ID);
    }

    @Test
    @DisplayName("should_SetAndGetClientSecret_When_PropertyProvided")
    void should_SetAndGetClientSecret_When_PropertyProvided() {
        // When
        String clientSecret = cognitoProperties.getClientSecret();

        // Then
        assertThat(clientSecret).isEqualTo(TEST_CLIENT_SECRET);
    }

    @Test
    @DisplayName("should_SetAndGetDomain_When_PropertyProvided")
    void should_SetAndGetDomain_When_PropertyProvided() {
        // When
        String domain = cognitoProperties.getDomain();

        // Then
        assertThat(domain).isEqualTo(TEST_DOMAIN);
    }

    @Test
    @DisplayName("should_BuildCorrectJwkUrl_When_RegionAndUserPoolIdProvided")
    void should_BuildCorrectJwkUrl_When_RegionAndUserPoolIdProvided() {
        // When
        String jwkUrl = cognitoProperties.getJwkUrl();

        // Then
        assertThat(jwkUrl).isEqualTo(
                "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123XYZ/.well-known/jwks.json"
        );
    }

    @Test
    @DisplayName("should_BuildCorrectIssuerUri_When_RegionAndUserPoolIdProvided")
    void should_BuildCorrectIssuerUri_When_RegionAndUserPoolIdProvided() {
        // When
        String issuerUri = cognitoProperties.getIssuerUri();

        // Then
        assertThat(issuerUri).isEqualTo(
                "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC123XYZ"
        );
    }

    @Test
    @DisplayName("should_BuildCorrectTokenUrl_When_DomainAndRegionProvided")
    void should_BuildCorrectTokenUrl_When_DomainAndRegionProvided() {
        // When
        String tokenUrl = cognitoProperties.getTokenUrl();

        // Then
        assertThat(tokenUrl).isEqualTo(
                "https://my-app-domain.auth.us-east-1.amazoncognito.com/oauth2/token"
        );
    }

    @Test
    @DisplayName("should_BuildCorrectAuthorizeUrl_When_DomainAndRegionProvided")
    void should_BuildCorrectAuthorizeUrl_When_DomainAndRegionProvided() {
        // When
        String authorizeUrl = cognitoProperties.getAuthorizeUrl();

        // Then
        assertThat(authorizeUrl).isEqualTo(
                "https://my-app-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize"
        );
    }

    @Test
    @DisplayName("should_BuildCorrectUserInfoUrl_When_DomainAndRegionProvided")
    void should_BuildCorrectUserInfoUrl_When_DomainAndRegionProvided() {
        // When
        String userInfoUrl = cognitoProperties.getUserInfoUrl();

        // Then
        assertThat(userInfoUrl).isEqualTo(
                "https://my-app-domain.auth.us-east-1.amazoncognito.com/oauth2/userInfo"
        );
    }

    @Test
    @DisplayName("should_BuildCorrectUrls_When_DifferentRegionProvided")
    void should_BuildCorrectUrls_When_DifferentRegionProvided() {
        // Given
        cognitoProperties.setRegion("eu-west-1");
        cognitoProperties.setUserPoolId("eu-west-1_XYZ789ABC");

        // When
        String jwkUrl = cognitoProperties.getJwkUrl();
        String issuerUri = cognitoProperties.getIssuerUri();
        String tokenUrl = cognitoProperties.getTokenUrl();

        // Then
        assertThat(jwkUrl).contains("eu-west-1");
        assertThat(jwkUrl).contains("eu-west-1_XYZ789ABC");
        assertThat(issuerUri).contains("eu-west-1");
        assertThat(issuerUri).contains("eu-west-1_XYZ789ABC");
        assertThat(tokenUrl).contains("eu-west-1");
    }

    @Test
    @DisplayName("should_UpdateJwkUrl_When_RegionIsChanged")
    void should_UpdateJwkUrl_When_RegionIsChanged() {
        // Given
        String originalJwkUrl = cognitoProperties.getJwkUrl();

        // When
        cognitoProperties.setRegion("ap-southeast-1");
        String newJwkUrl = cognitoProperties.getJwkUrl();

        // Then
        assertThat(originalJwkUrl).contains("us-east-1");
        assertThat(newJwkUrl).contains("ap-southeast-1");
        assertThat(originalJwkUrl).isNotEqualTo(newJwkUrl);
    }

    @Test
    @DisplayName("should_UpdateIssuerUri_When_UserPoolIdIsChanged")
    void should_UpdateIssuerUri_When_UserPoolIdIsChanged() {
        // Given
        String originalIssuerUri = cognitoProperties.getIssuerUri();

        // When
        cognitoProperties.setUserPoolId("us-east-1_NEWPOOL123");
        String newIssuerUri = cognitoProperties.getIssuerUri();

        // Then
        assertThat(originalIssuerUri).contains("us-east-1_ABC123XYZ");
        assertThat(newIssuerUri).contains("us-east-1_NEWPOOL123");
        assertThat(originalIssuerUri).isNotEqualTo(newIssuerUri);
    }

    @Test
    @DisplayName("should_UpdateTokenUrl_When_DomainIsChanged")
    void should_UpdateTokenUrl_When_DomainIsChanged() {
        // Given
        String originalTokenUrl = cognitoProperties.getTokenUrl();

        // When
        cognitoProperties.setDomain("new-domain");
        String newTokenUrl = cognitoProperties.getTokenUrl();

        // Then
        assertThat(originalTokenUrl).contains("my-app-domain");
        assertThat(newTokenUrl).contains("new-domain");
        assertThat(originalTokenUrl).isNotEqualTo(newTokenUrl);
    }

    @Test
    @DisplayName("should_BuildUrlsWithCorrectFormat_When_AllPropertiesSet")
    void should_BuildUrlsWithCorrectFormat_When_AllPropertiesSet() {
        // When
        String jwkUrl = cognitoProperties.getJwkUrl();
        String issuerUri = cognitoProperties.getIssuerUri();
        String tokenUrl = cognitoProperties.getTokenUrl();
        String authorizeUrl = cognitoProperties.getAuthorizeUrl();
        String userInfoUrl = cognitoProperties.getUserInfoUrl();

        // Then
        assertThat(jwkUrl).startsWith("https://");
        assertThat(jwkUrl).endsWith("/.well-known/jwks.json");

        assertThat(issuerUri).startsWith("https://cognito-idp.");
        assertThat(issuerUri).contains("amazonaws.com");

        assertThat(tokenUrl).startsWith("https://");
        assertThat(tokenUrl).contains(".auth.");
        assertThat(tokenUrl).endsWith("/oauth2/token");

        assertThat(authorizeUrl).startsWith("https://");
        assertThat(authorizeUrl).contains(".auth.");
        assertThat(authorizeUrl).endsWith("/oauth2/authorize");

        assertThat(userInfoUrl).startsWith("https://");
        assertThat(userInfoUrl).contains(".auth.");
        assertThat(userInfoUrl).endsWith("/oauth2/userInfo");
    }

    @Test
    @DisplayName("should_HandleMultipleRegions_When_BuildingUrls")
    void should_HandleMultipleRegions_When_BuildingUrls() {
        // Given/When/Then for US East 1
        cognitoProperties.setRegion("us-east-1");
        assertThat(cognitoProperties.getTokenUrl()).contains("us-east-1");

        // Given/When/Then for EU West 1
        cognitoProperties.setRegion("eu-west-1");
        assertThat(cognitoProperties.getTokenUrl()).contains("eu-west-1");

        // Given/When/Then for AP Southeast 1
        cognitoProperties.setRegion("ap-southeast-1");
        assertThat(cognitoProperties.getTokenUrl()).contains("ap-southeast-1");

        // Given/When/Then for SA East 1
        cognitoProperties.setRegion("sa-east-1");
        assertThat(cognitoProperties.getTokenUrl()).contains("sa-east-1");
    }

    @Test
    @DisplayName("should_ReturnConsistentUrls_When_CalledMultipleTimes")
    void should_ReturnConsistentUrls_When_CalledMultipleTimes() {
        // When
        String jwkUrl1 = cognitoProperties.getJwkUrl();
        String jwkUrl2 = cognitoProperties.getJwkUrl();
        String jwkUrl3 = cognitoProperties.getJwkUrl();

        // Then
        assertThat(jwkUrl1).isEqualTo(jwkUrl2);
        assertThat(jwkUrl2).isEqualTo(jwkUrl3);
    }

    @Test
    @DisplayName("should_AllowNullValues_When_PropertiesNotSet")
    void should_AllowNullValues_When_PropertiesNotSet() {
        // Given
        CognitoProperties emptyProperties = new CognitoProperties();

        // When/Then
        assertThat(emptyProperties.getRegion()).isNull();
        assertThat(emptyProperties.getUserPoolId()).isNull();
        assertThat(emptyProperties.getClientId()).isNull();
        assertThat(emptyProperties.getClientSecret()).isNull();
        assertThat(emptyProperties.getDomain()).isNull();
    }

    @Test
    @DisplayName("should_BuildUrlsWithNullValues_When_PropertiesNotSet")
    void should_BuildUrlsWithNullValues_When_PropertiesNotSet() {
        // Given
        CognitoProperties emptyProperties = new CognitoProperties();

        // When
        String jwkUrl = emptyProperties.getJwkUrl();
        String issuerUri = emptyProperties.getIssuerUri();
        String tokenUrl = emptyProperties.getTokenUrl();

        // Then - URLs will contain "null" strings when properties are not set
        assertThat(jwkUrl).contains("null");
        assertThat(issuerUri).contains("null");
        assertThat(tokenUrl).contains("null");
    }
}
