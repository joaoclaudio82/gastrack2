package com.gastrack.configuration;

import org.springframework.context.annotation.Configuration;

/**
 * Configuration for API versioning
 * Centralized definition of API version paths
 */
@Configuration
public class ApiVersionConfiguration {

    public static final String API_V1 = "/api/v1";

    // Future versions can be added here
    // public static final String API_V2 = "/api/v2";
}
