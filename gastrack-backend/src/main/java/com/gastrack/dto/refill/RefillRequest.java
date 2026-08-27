package com.gastrack.dto.refill;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Ação do cliente "Troquei o botijão".
 *
 * <p>{@code outgoingCylinderId} identifica qual casco saiu do banco. Sem ele não dá para
 * saber o que aposentar: com um sensor medindo a saída combinada do manifold, o sistema
 * não deduz qual dos cilindros foi trocado. É nulo apenas quando a linha ainda não tem
 * cilindro cadastrado (primeira carga).
 */
public record RefillRequest(

    @NotBlank(message = "Serial number is required")
    @Size(max = 100, message = "Serial number must not exceed 100 characters")
    String serialNumber,

    @NotNull(message = "Cylinder model ID is required")
    Long cylinderModelId,

    Long outgoingCylinderId
) {}
