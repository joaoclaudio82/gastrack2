package com.gastrack.dto.cylinder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CylinderRequest(
    @NotNull(message = "Cylinder model ID is required")
    Long cylinderModelId,

    @NotNull(message = "Company ID is required")
    Long companyId,

    Long pontoGasId,

    Long addressId,

    @NotBlank(message = "Serial number is required")
    @Size(max = 100, message = "Serial number must not exceed 100 characters")
    String serialNumber,

    /** Válvula aberta no manifold. Nulo = aberto (padrão), como todo cilindro já cadastrado. */
    Boolean connected
) {}
