package com.condocompare.ia.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class IAServiceConfig {

    @Value("${ia-service.url:http://localhost:8000}")
    private String iaServiceUrl;

    @Value("${ia-service.timeout:30000}")
    private int timeout;

    @Bean
    public WebClient iaServiceWebClient() {
        return WebClient.builder()
            .baseUrl(iaServiceUrl + "/api/v1")
            .build();
    }

    public String getIaServiceUrl() {
        return iaServiceUrl;
    }

    public int getTimeout() {
        return timeout;
    }
}
