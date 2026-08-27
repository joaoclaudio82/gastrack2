package com.gastrack.exceptions;

/**
 * Exception thrown when attempting to create a user that already exists.
 * This typically happens when a user with the same email or Cognito sub
 * is already registered in the system.
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }

    public UserAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }

    public static UserAlreadyExistsException byCognitoSub(String cognitoSub) {
        return new UserAlreadyExistsException("User already exists with Cognito sub: " + cognitoSub);
    }

    public static UserAlreadyExistsException byEmail(String email) {
        return new UserAlreadyExistsException("User already exists with email: " + email);
    }
}
