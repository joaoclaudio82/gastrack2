package com.gastrack.exceptions;

/**
 * Exception thrown when a user is not found in the system.
 * This is a runtime exception that can be thrown when attempting to
 * retrieve a user by ID, email, username, or Cognito sub.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public static UserNotFoundException byCognitoSub(String cognitoSub) {
        return new UserNotFoundException("User not found with Cognito sub: " + cognitoSub);
    }

    public static UserNotFoundException byEmail(String email) {
        return new UserNotFoundException("User not found with email: " + email);
    }

    public static UserNotFoundException byId(Long id) {
        return new UserNotFoundException("User not found with ID: " + id);
    }
}
