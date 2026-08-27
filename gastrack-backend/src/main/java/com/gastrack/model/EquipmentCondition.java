package com.gastrack.model;

/**
 * Condition of equipment.
 */
public enum EquipmentCondition {
    /**
     * Brand new equipment.
     */
    NEW,

    /**
     * Equipment in good condition.
     */
    GOOD,

    /**
     * Equipment in fair condition, may need attention.
     */
    FAIR,

    /**
     * Equipment in poor condition, needs maintenance.
     */
    POOR,

    /**
     * Equipment is damaged.
     */
    DAMAGED,

    /**
     * Equipment has been retired from service.
     */
    RETIRED
}
