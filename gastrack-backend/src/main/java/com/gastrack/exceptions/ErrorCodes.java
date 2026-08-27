package com.gastrack.exceptions;

/**
 * Códigos estáveis de erro devolvidos em {@link ApiExceptionResponse#getErrorCode()}.
 *
 * <p>O campo já existia no contrato, mas chegava sempre {@code null}: o cliente só conseguia
 * reconhecer o erro casando o texto da mensagem, então reescrever uma mensagem no backend quebrava
 * a tradução do frontend sem quebrar teste nenhum. Estes códigos cobrem os casos que o cliente
 * precisa tratar de forma específica; o resto cai no nome do status HTTP.
 */
public final class ErrorCodes {

    /** Linha de gás já opera outro gás — misturar no mesmo manifold é recusado. */
    public static final String GAS_TYPE_MISMATCH = "GAS_TYPE_MISMATCH";

    /** Número de série de cilindro já em uso. */
    public static final String CYLINDER_SERIAL_DUPLICATE = "CYLINDER_SERIAL_DUPLICATE";

    private ErrorCodes() {
    }
}
