package com.gastrack.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Utility class responsible for generating contract numbers that follow the CRT-ddMMyyyy-ID pattern.
 */
public final class ContractNumberGenerator {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("ddMMyyyy");

    private ContractNumberGenerator() {
    }

    /**
     * Generate the final contract number based on the reference date (usually the contract start)
     * and the persisted contract identifier.
     */
    public static String generate(LocalDate referenceDate, Long contractId) {
        if (contractId == null) {
            throw new IllegalArgumentException("Contract ID is required to generate the contract number");
        }
        LocalDate date = referenceDate != null ? referenceDate : LocalDate.now();
        return "CRT-" + FORMATTER.format(date) + '-' + contractId;
    }

    /**
     * Generate a unique temporary contract number that satisfies the NOT NULL + UNIQUE constraint
     * before we know the definitive identifier.
     */
    public static String generateTemporary() {
        return "CRT-TMP-" + UUID.randomUUID();
    }
}
