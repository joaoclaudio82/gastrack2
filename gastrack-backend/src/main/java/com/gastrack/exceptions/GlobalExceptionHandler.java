package com.gastrack.exceptions;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiExceptionResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        String message = "Invalid JSON format";

        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException invalidFormatEx) {
            String fieldName = invalidFormatEx.getPath().stream()
                    .map(JsonMappingException.Reference::getFieldName)
                    .collect(Collectors.joining("."));
            message = String.format("Invalid value for field '%s': %s", fieldName, invalidFormatEx.getValue());
        } else if (cause instanceof JsonMappingException jsonEx) {
            String fieldName = jsonEx.getPath().stream()
                    .map(JsonMappingException.Reference::getFieldName)
                    .collect(Collectors.joining("."));
            message = String.format("Error parsing field '%s': %s", fieldName, jsonEx.getOriginalMessage());
        } else if (ex.getMessage() != null) {
            if (ex.getMessage().contains("Required request body is missing")) {
                message = "Request body is required";
            } else if (ex.getMessage().contains("JSON parse error")) {
                message = "Invalid JSON: " + extractJsonErrorMessage(ex.getMessage());
            }
        }

        log.warn("JSON parse error: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiExceptionResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String message = String.format("HTTP method '%s' is not supported for this endpoint. Supported methods: %s",
                ex.getMethod(),
                ex.getSupportedHttpMethods());

        log.warn("Method not supported: {}", ex.getMessage());
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, message);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiExceptionResponse> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        String message = String.format("Content type '%s' is not supported. Supported types: %s",
                ex.getContentType(),
                ex.getSupportedMediaTypes());

        log.warn("Media type not supported: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, message);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiExceptionResponse> handleMissingParameter(MissingServletRequestParameterException ex) {
        String message = String.format("Required parameter '%s' of type '%s' is missing",
                ex.getParameterName(),
                ex.getParameterType());

        log.warn("Missing parameter: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiExceptionResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = String.format("Parameter '%s' should be of type '%s'",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        log.warn("Type mismatch: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiExceptionResponse> handleNoHandlerFound(NoHandlerFoundException ex) {
        String message = String.format("Endpoint '%s %s' not found",
                ex.getHttpMethod(),
                ex.getRequestURL());

        log.warn("No handler found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, message);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiExceptionResponse> handleNoResourceFound(NoResourceFoundException ex) {
        String message = String.format("Endpoint '%s' not found", ex.getResourcePath());
        log.warn("No resource found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiExceptionResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiExceptionResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> {
                    String field = error.getField();
                    String defaultMessage = error.getDefaultMessage();
                    return String.format("%s: %s", field, defaultMessage);
                })
                .collect(Collectors.joining("; "));

        if (message.isEmpty()) {
            message = "Erro de validação nos dados enviados.";
        }

        log.warn("Validation error: {}", message);
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(CognitoAuthException.class)
    public ResponseEntity<ApiExceptionResponse> handleCognitoAuthException(CognitoAuthException ex) {
        log.warn("Cognito auth error [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return buildResponseWithCode(ex.getStatus(), ex.getMessage(), ex.getErrorCode());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiExceptionResponse> handleBusinessException(BusinessException ex) {
        log.warn("Business error [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return buildResponseWithCode(HttpStatus.BAD_REQUEST, ex.getMessage(),
                ex.getErrorCode() != null ? ex.getErrorCode() : HttpStatus.BAD_REQUEST.name());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiExceptionResponse> handleConflictException(ConflictException ex) {
        log.warn("Conflict [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return buildResponseWithCode(HttpStatus.CONFLICT, ex.getMessage(),
                ex.getErrorCode() != null ? ex.getErrorCode() : HttpStatus.CONFLICT.name());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiExceptionResponse> handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException ex) {
        // Unique-constraint collisions (CNPJ, slug, asset tag, ...) that bypass the service-level
        // pre-check (e.g. concurrent inserts) surface here. Return 409 instead of falling through
        // to the catch-all 500 handler.
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        return buildResponse(HttpStatus.CONFLICT, "The resource conflicts with an existing record.");
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiExceptionResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiExceptionResponse> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiExceptionResponse> handleSpringAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex) {
        log.warn("Security access denied: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "Access denied to this resource");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiExceptionResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again later.");
    }

    /**
     * Todo erro sai com `errorCode` preenchido. Sem código estável o cliente só reconhece o caso
     * casando o texto da mensagem, e reescrever a mensagem quebra o cliente em silêncio. Sem código
     * específico, o nome do status HTTP já é um contrato melhor que `null`.
     */
    private ResponseEntity<ApiExceptionResponse> buildResponse(HttpStatus status, String message) {
        return buildResponseWithCode(status, message, status.name());
    }

    private ResponseEntity<ApiExceptionResponse> buildResponseWithCode(HttpStatus status, String message, String errorCode) {
        ApiExceptionResponse response = new ApiExceptionResponse(
                message,
                status,
                LocalDateTime.now(),
                errorCode
        );
        return ResponseEntity.status(status).body(response);
    }

    private String extractJsonErrorMessage(String fullMessage) {
        if (fullMessage.contains(":")) {
            int colonIndex = fullMessage.indexOf(":");
            String extracted = fullMessage.substring(colonIndex + 1).trim();
            if (extracted.contains(";")) {
                extracted = extracted.substring(0, extracted.indexOf(";")).trim();
            }
            return extracted;
        }
        return "malformed JSON";
    }
}
