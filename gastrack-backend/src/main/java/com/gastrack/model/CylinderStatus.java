package com.gastrack.model;

/**
 * Status of a gas cylinder based on pressure level.
 */
public enum CylinderStatus {

    /**
     * Cylinder is full (above 80% capacity).
     */
    FULL,

    /**
     * Cylinder has normal pressure (50-80% capacity).
     */
    NORMAL,

    /**
     * Cylinder is getting low (20-50% capacity).
     */
    LOW,

    /**
     * Cylinder is at critical level (below 20% capacity).
     */
    CRITICAL,

    /**
     * Cylinder is empty (no pressure).
     */
    EMPTY,

    /**
     * Cylinder status is unknown (no reading).
     */
    UNKNOWN
}
