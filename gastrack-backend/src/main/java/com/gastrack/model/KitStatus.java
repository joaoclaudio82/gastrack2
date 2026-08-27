package com.gastrack.model;

import java.util.Set;

/**
 * Status for equipment kits.
 *
 * State machine flow:
 * PENDING -> INSTALLED <-> MAINTENANCE -> REMOVED -> DECOMMISSIONED
 */
public enum KitStatus {
    /**
     * Kit is pending installation.
     */
    PENDING,

    /**
     * Kit is installed and operational.
     */
    INSTALLED,

    /**
     * Kit is under maintenance.
     */
    MAINTENANCE,

    /**
     * Kit has been removed from location.
     */
    REMOVED,

    /**
     * Kit has been decommissioned.
     */
    DECOMMISSIONED;

    /**
     * Check if the kit can be installed from this status.
     * A kit can only be installed if it's PENDING or REMOVED.
     */
    public boolean canInstall() {
        return this == PENDING || this == REMOVED;
    }

    /**
     * Get the allowed transitions from this status.
     */
    public Set<KitStatus> getAllowedTransitions() {
        return switch (this) {
            case PENDING -> Set.of(INSTALLED);
            case INSTALLED -> Set.of(MAINTENANCE, REMOVED);
            case MAINTENANCE -> Set.of(INSTALLED, REMOVED);
            case REMOVED -> Set.of(INSTALLED, DECOMMISSIONED);
            case DECOMMISSIONED -> Set.of();
        };
    }
}
