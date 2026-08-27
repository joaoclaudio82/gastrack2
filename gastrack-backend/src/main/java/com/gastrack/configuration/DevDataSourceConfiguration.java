package com.gastrack.configuration;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * Perfil {@code dev}: DataSource criado em codigo para que variaveis de ambiente vazias
 * (ex.: {@code SPRING_DATASOURCE_PASSWORD=}) nao anulem a senha definida no YAML.
 */
@Configuration
@Profile("dev")
public class DevDataSourceConfiguration {

    @Bean
    @Primary
    public DataSource devDataSource(
            @Value("${DEV_LOCAL_DB_HOST:localhost}") String host,
            @Value("${DEV_LOCAL_DB_PORT:5432}") int port,
            @Value("${DEV_LOCAL_DB_USER:postgres}") String user,
            @Value("${DEV_LOCAL_DB_PASSWORD:example}") String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://" + host + ":" + port + "/appdb");
        ds.setUsername(user);
        ds.setPassword(password);
        ds.setPoolName("DevHikariPool");
        ds.setMaximumPoolSize(10);
        return ds;
    }
}
