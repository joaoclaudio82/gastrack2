package com.gastrack.model;

/**
 * How a {@link RefillEvent} was captured.
 * AUTO = pressure jump detected by the sensor; MANUAL = client informed a new bottle serial.
 */
public enum RefillSource {
    AUTO,
    MANUAL
}
