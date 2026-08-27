package com.gastrack.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing Configuration
 *
 * Enables JPA auditing for automatic population of audit fields
 * (createdAt, updatedAt) in entities that extend BaseAuditEntity.
 *
 * This configuration activates the @CreationTimestamp and @UpdateTimestamp
 * annotations, ensuring that timestamps are automatically managed.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfiguration {
    // No additional configuration needed
    // The @EnableJpaAuditing annotation activates JPA auditing features
}
