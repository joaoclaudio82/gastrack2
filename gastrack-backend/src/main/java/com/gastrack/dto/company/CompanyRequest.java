package com.gastrack.dto.company;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompanyRequest(
    @NotBlank(message = "Company name is required")
    @Size(max = 255, message = "Company name must not exceed 255 characters")
    String name,

    @NotBlank(message = "Slug is required")
    @Size(max = 100, message = "Slug must not exceed 100 characters")
    @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "Slug must be lowercase alphanumeric with hyphens")
    String slug,

    @NotBlank(message = "CNPJ is required")
    @Size(max = 18, message = "CNPJ must not exceed 18 characters")
    @Pattern(regexp = "^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$", message = "Invalid CNPJ format")
    String cnpj,

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    String phone,

    @Size(max = 255, message = "Email must not exceed 255 characters")
    @Email(message = "Invalid email format")
    @Pattern(
        regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$|^$",
        message = "Email must contain a valid domain (e.g. user@company.com)"
    )
    String email
) {
    public CompanyRequest(String name, String slug, String cnpj) {
        this(name, slug, cnpj, null, null);
    }
}
