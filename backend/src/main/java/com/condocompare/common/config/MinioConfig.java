package com.condocompare.common.config;

import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.region:us-east-1}")
    private String region;

    @Bean
    public MinioClient minioClient() {
        // MinIO client não aceita path no endpoint (ex: /storage/v1/s3)
        // Extrai apenas scheme + host pra compatibilidade com Supabase Storage
        String cleanEndpoint = endpoint;
        try {
            URI uri = URI.create(endpoint);
            if (uri.getPath() != null && !uri.getPath().isEmpty() && !uri.getPath().equals("/")) {
                cleanEndpoint = uri.getScheme() + "://" + uri.getHost();
                if (uri.getPort() > 0) {
                    cleanEndpoint += ":" + uri.getPort();
                }
                log.info("MinIO endpoint limpo (path removido): {} -> {}", endpoint, cleanEndpoint);
            }
        } catch (Exception e) {
            log.warn("Erro ao parsear endpoint MinIO: {}", e.getMessage());
        }

        log.info("Configurando MinIO: endpoint={}, region={}", cleanEndpoint, region);
        return MinioClient.builder()
            .endpoint(cleanEndpoint)
            .credentials(accessKey, secretKey)
            .region(region)
            .build();
    }
}
