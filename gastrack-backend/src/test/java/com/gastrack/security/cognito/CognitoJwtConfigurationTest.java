package com.gastrack.security.cognito;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CognitoJwtConfigurationTest {

    @Mock
    private CognitoProperties cognitoProperties;

    @Test
    void should_ThrowIllegalStateException_When_UserPoolIdIsBlank() {
        when(cognitoProperties.getUserPoolId()).thenReturn("   ");
        CognitoJwtConfiguration configuration = new CognitoJwtConfiguration(cognitoProperties);

        IllegalStateException ex = assertThrows(IllegalStateException.class, configuration::jwtDecoder);

        assertTrue(ex.getMessage().contains("user-pool-id"));
    }

    @Test
    void should_ThrowIllegalStateException_When_UserPoolIdIsNull() {
        when(cognitoProperties.getUserPoolId()).thenReturn(null);
        CognitoJwtConfiguration configuration = new CognitoJwtConfiguration(cognitoProperties);

        assertThrows(IllegalStateException.class, configuration::jwtDecoder);
    }
}
