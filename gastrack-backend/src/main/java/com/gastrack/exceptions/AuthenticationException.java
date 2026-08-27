package com.gastrack.exceptions;

/**
 * Exception thrown when authentication fails.
 * This can include invalid credentials, expired tokens,
 * or other authentication-related errors.
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }

    public static AuthenticationException invalidCredentials() {
        return new AuthenticationException("Invalid username or password");
    }

    public static AuthenticationException expiredToken() {
        return new AuthenticationException("Authentication token has expired");
    }

    public static AuthenticationException invalidToken() {
        return new AuthenticationException("Invalid authentication token");
    }

    public static AuthenticationException userNotConfirmed() {
        return new AuthenticationException("User account is not confirmed. Please check your email for confirmation code.");
    }
}
