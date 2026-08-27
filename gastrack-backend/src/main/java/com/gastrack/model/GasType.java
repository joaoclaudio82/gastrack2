package com.gastrack.model;

/**
 * Type of compressed gas tracked by the platform.
 * Pressure is a valid proxy for load only for compressed gases (see spec §1).
 */
public enum GasType {
    GN,
    O2,
    N2,
    CO2,
    AR_COMP
}
