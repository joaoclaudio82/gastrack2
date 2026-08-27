package com.gastrack.model;

/**
 * Operations tracked in movement history.
 */
public enum MovementOperation {
    // Equipment operations
    CREATED,
    ASSIGNED_TO_KIT,
    REMOVED_FROM_KIT,
    TRANSFERRED,
    CONDITION_CHANGED,
    DEACTIVATED,
    REACTIVATED,

    // Kit operations
    KIT_CREATED,
    KIT_INSTALLED,
    KIT_MAINTENANCE_START,
    KIT_MAINTENANCE_END,
    KIT_REMOVED,
    KIT_DECOMMISSIONED
}
