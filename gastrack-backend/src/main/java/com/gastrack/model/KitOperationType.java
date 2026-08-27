package com.gastrack.model;

/**
 * Type of operation performed on a kit installation.
 */
public enum KitOperationType {
    /**
     * Kit installed at a location.
     */
    INSTALLED,

    /**
     * Kit removed from a location.
     */
    UNINSTALLED,

    /**
     * Kit moved to a different location.
     */
    RELOCATED
}
