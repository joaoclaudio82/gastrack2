package com.gastrack.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita {@code @Scheduled}. Necessário para o
 * {@link com.gastrack.service.GasPointReadingSyncJob}, que traz a leitura do sensor
 * (DynamoDB) para o estado da linha de gás.
 */
@Configuration
@EnableScheduling
public class SchedulingConfiguration {
}
