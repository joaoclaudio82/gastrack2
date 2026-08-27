package com.gastrack.configuration;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Configuration for rate limiting using Bucket4j
 */
@Configuration
public class RateLimitConfiguration {

    @Value("${rate-limit.auth.requests-per-minute:10}")
    private int authRequestsPerMinute;

    @Value("${rate-limit.api.requests-per-minute:100}")
    private int apiRequestsPerMinute;

    @Bean
    public Bucket authRateLimitBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(authRequestsPerMinute, Refill.intervally(authRequestsPerMinute, Duration.ofMinutes(1))))
                .build();
    }

    @Bean
    public Bucket apiRateLimitBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(apiRequestsPerMinute, Refill.intervally(apiRequestsPerMinute, Duration.ofMinutes(1))))
                .build();
    }
}
