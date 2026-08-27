package com.gastrack.exceptions;

/**
 * Exception thrown when password reset operations fail.
 * This includes invalid confirmation codes, expired codes,
 * or other password reset-related errors.
 */
public class PasswordResetException extends RuntimeException {

    public PasswordResetException(String message) {
        super(message);
    }

    public PasswordResetException(String message, Throwable cause) {
        super(message, cause);
    }

    public static PasswordResetException invalidCode() {
        return new PasswordResetException("Invalid or expired confirmation code");
    }

    public static PasswordResetException tooManyAttempts() {
        return new PasswordResetException("Too many password reset attempts. Please try again later.");
    }

    public static PasswordResetException userNotFound() {
        return new PasswordResetException("User not found for password reset");
    }
}
