package com.gastrack.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CognitoAuthException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public CognitoAuthException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = null;
    }

    public CognitoAuthException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public static CognitoAuthException fromCognitoError(String errorCode, String errorMessage) {
        return switch (errorCode) {
            case "NotAuthorizedException" -> new CognitoAuthException(
                    "Credenciais inválidas. Verifique seu email e senha.",
                    HttpStatus.UNAUTHORIZED,
                    errorCode
            );
            case "UserNotFoundException" -> new CognitoAuthException(
                    "Usuário não encontrado.",
                    HttpStatus.NOT_FOUND,
                    errorCode
            );
            case "UserNotConfirmedException" -> new CognitoAuthException(
                    "Conta não confirmada. Verifique seu email para o código de confirmação.",
                    HttpStatus.FORBIDDEN,
                    errorCode
            );
            case "UsernameExistsException" -> new CognitoAuthException(
                    "Este email já está cadastrado.",
                    HttpStatus.CONFLICT,
                    errorCode
            );
            case "InvalidPasswordException" -> new CognitoAuthException(
                    "Senha inválida. A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.",
                    HttpStatus.BAD_REQUEST,
                    errorCode
            );
            case "CodeMismatchException" -> new CognitoAuthException(
                    "Código de verificação inválido.",
                    HttpStatus.BAD_REQUEST,
                    errorCode
            );
            case "ExpiredCodeException" -> new CognitoAuthException(
                    "Código de verificação expirado. Solicite um novo código.",
                    HttpStatus.BAD_REQUEST,
                    errorCode
            );
            case "LimitExceededException" -> new CognitoAuthException(
                    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
                    HttpStatus.TOO_MANY_REQUESTS,
                    errorCode
            );
            case "TooManyRequestsException" -> new CognitoAuthException(
                    "Muitas requisições. Aguarde alguns minutos e tente novamente.",
                    HttpStatus.TOO_MANY_REQUESTS,
                    errorCode
            );
            case "InvalidParameterException" -> new CognitoAuthException(
                    "Parâmetros inválidos: " + errorMessage,
                    HttpStatus.BAD_REQUEST,
                    errorCode
            );
            case "PasswordResetRequiredException" -> new CognitoAuthException(
                    "É necessário redefinir sua senha.",
                    HttpStatus.FORBIDDEN,
                    errorCode
            );
            default -> new CognitoAuthException(
                    errorMessage != null ? errorMessage : "Erro de autenticação.",
                    HttpStatus.BAD_REQUEST,
                    errorCode
            );
        };
    }
}
