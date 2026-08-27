package com.gastrack.dto.company;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CompanyRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void should_FailValidation_When_CnpjIsBlank() {
        CompanyRequest request = new CompanyRequest(
            "Test Company",
            "test-company",
            "   ",
            null,
            null
        );

        Set<ConstraintViolation<CompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(ConstraintViolation::getMessage)
            .anyMatch(message -> message.toLowerCase().contains("cnpj"));
    }

    @Test
    void should_FailValidation_When_CnpjHasInvalidFormat() {
        CompanyRequest request = new CompanyRequest(
            "Test Company",
            "test-company",
            "invalid-cnpj",
            null,
            null
        );

        Set<ConstraintViolation<CompanyRequest>> violations = validator.validate(request);

        assertThat(violations)
            .extracting(ConstraintViolation::getMessage)
            .anyMatch(message -> message.toLowerCase().contains("cnpj"));
    }

    @Test
    void should_PassValidation_When_CnpjIsValid() {
        CompanyRequest request = new CompanyRequest(
            "Test Company",
            "test-company",
            "12.345.678/0001-90",
            null,
            null
        );

        Set<ConstraintViolation<CompanyRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }
}
