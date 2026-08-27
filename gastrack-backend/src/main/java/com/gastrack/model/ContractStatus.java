package com.gastrack.model;

/**
 * Status for contracts.
 */
public enum ContractStatus {
    /**
     * Contract is being drafted, not yet active.
     */
    DRAFT,

    /**
     * Contract is active and kits can be created.
     */
    ACTIVE,

    /**
     * Contract is temporarily suspended.
     */
    SUSPENDED,

    /**
     * Contract has expired (end date passed).
     */
    EXPIRED,

    /**
     * Contract has been cancelled.
     */
    CANCELLED
}
