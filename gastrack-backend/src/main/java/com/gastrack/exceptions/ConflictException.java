package com.gastrack.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a request conflicts with the current state of a resource, typically a duplicate
 * that violates a unique constraint (e.g. slug, CNPJ, asset tag already in use).
 *
 * <p>Maps to HTTP 409 CONFLICT. Use this instead of {@link BusinessException} (400) whenever the
 * failure is "the resource already exists" rather than "the input is invalid".
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {

    /**
     * Código estável do erro, quando existe. Sem ele o cliente só reconhece o caso casando o texto
     * da mensagem — e qualquer reescrita da mensagem quebra o cliente em silêncio.
     */
    private final String errorCode;

    public ConflictException(String message) {
        this(message, (String) null);
    }

    public ConflictException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
