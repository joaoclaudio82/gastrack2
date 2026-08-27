package com.gastrack.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.time.LocalDateTime;

@Slf4j
@RestControllerAdvice
public class CognitoControllerAdvice {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiExceptionResponse> handleUserNotFound(UserNotFoundException ex) {
        log.error("User not found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, "User not found");
    }

    @ExceptionHandler(NotAuthorizedException.class)
    public ResponseEntity<ApiExceptionResponse> handleNotAuthorized(NotAuthorizedException ex) {
        log.error("Authentication failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @ExceptionHandler(UsernameExistsException.class)
    public ResponseEntity<ApiExceptionResponse> handleUsernameExists(UsernameExistsException ex) {
        log.error("Username already exists: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, "Username already exists");
    }

    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<ApiExceptionResponse> handleInvalidPassword(InvalidPasswordException ex) {
        log.error("Invalid password: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Password does not meet requirements");
    }

    @ExceptionHandler(CodeMismatchException.class)
    public ResponseEntity<ApiExceptionResponse> handleCodeMismatch(CodeMismatchException ex) {
        log.error("Code mismatch: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Invalid confirmation code");
    }

    @ExceptionHandler(ExpiredCodeException.class)
    public ResponseEntity<ApiExceptionResponse> handleExpiredCode(ExpiredCodeException ex) {
        log.error("Expired code: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Confirmation code has expired");
    }

    @ExceptionHandler(UserNotConfirmedException.class)
    public ResponseEntity<ApiExceptionResponse> handleUserNotConfirmed(UserNotConfirmedException ex) {
        log.error("User not confirmed: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "User account not confirmed. Please check your email for confirmation code.");
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiExceptionResponse> handleTooManyRequests(TooManyRequestsException ex) {
        log.error("Too many requests: {}", ex.getMessage());
        return buildResponse(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again later.");
    }

    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<ApiExceptionResponse> handleLimitExceeded(LimitExceededException ex) {
        log.error("Limit exceeded: {}", ex.getMessage());
        return buildResponse(HttpStatus.TOO_MANY_REQUESTS, "Request limit exceeded. Please try again later.");
    }

    @ExceptionHandler(CognitoIdentityProviderException.class)
    public ResponseEntity<ApiExceptionResponse> handleCognitoException(CognitoIdentityProviderException ex) {
        log.error("Cognito error: {}", ex.awsErrorDetails().errorMessage());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Authentication service error");
    }

    private ResponseEntity<ApiExceptionResponse> buildResponse(HttpStatus status, String message) {
        ApiExceptionResponse response = new ApiExceptionResponse(
                message,
                status,
                LocalDateTime.now()
        );
        return ResponseEntity.status(status).body(response);
    }
}
