package com.gastrack.dto.contract;

/**
 * Lightweight DTO representing an address allowed for a contract.
 */
public record ContractAddressResponse(
    Long id,
    String name,
    String fullAddress,
    Boolean active
) {}
