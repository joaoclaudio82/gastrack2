package com.gastrack.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Configuration for cylinder status thresholds.
 * These values determine when a cylinder transitions between status levels.
 *
 * <p>Configuration example in application.yml:</p>
 * <pre>
 * gastrack:
 *   cylinder:
 *     thresholds:
 *       critical: 20.0
 *       low: 50.0
 *       normal: 80.0
 * </pre>
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "gastrack.cylinder.thresholds")
@Validated
public class CylinderThresholdsConfiguration {

    /**
     * Fill percentage below which a cylinder is considered CRITICAL.
     * Default: 20%
     */
    @Min(value = 0, message = "Critical threshold must be at least 0")
    @Max(value = 100, message = "Critical threshold must not exceed 100")
    private double critical = 20.0;

    /**
     * Fill percentage below which a cylinder is considered LOW.
     * Must be greater than critical threshold.
     * Default: 50%
     */
    @Min(value = 0, message = "Low threshold must be at least 0")
    @Max(value = 100, message = "Low threshold must not exceed 100")
    private double low = 50.0;

    /**
     * Fill percentage below which a cylinder is considered NORMAL.
     * Must be greater than low threshold.
     * Cylinders at or above this percentage are considered FULL.
     * Default: 80%
     */
    @Min(value = 0, message = "Normal threshold must be at least 0")
    @Max(value = 100, message = "Normal threshold must not exceed 100")
    private double normal = 80.0;

    /**
     * Validates that thresholds are in correct order: critical < low < normal
     */
    public boolean isValid() {
        return critical < low && low < normal && normal <= 100;
    }
}
