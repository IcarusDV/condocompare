package com.condocompare.documentos.service;

import com.condocompare.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;

/**
 * Storage service compatible with both MinIO and Supabase Storage.
 * Uses REST API for Supabase compatibility instead of MinIO Java client.
 */
@Service
@Slf4j
public class MinioService {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String defaultBucket;

    @Value("${minio.region:us-east-1}")
    private String region;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Detecta se estamos usando Supabase Storage
     */
    private boolean isSupabase() {
        return endpoint != null && endpoint.contains("supabase.co");
    }

    /**
     * Retorna a base URL da API do Supabase Storage
     */
    private String getSupabaseStorageUrl() {
        // Endpoint pode ser: https://xxx.supabase.co ou https://xxx.storage.supabase.co
        String base = endpoint.replaceAll("/storage/v1/s3$", "").replaceAll("/$", "");
        if (base.contains(".storage.supabase.co")) {
            // https://xxx.storage.supabase.co -> https://xxx.supabase.co/storage/v1
            base = base.replace(".storage.supabase.co", ".supabase.co");
        }
        return base + "/storage/v1";
    }

    /**
     * Faz upload de um arquivo
     * @return objectKey (caminho do arquivo no bucket)
     */
    public String uploadFile(MultipartFile file, UUID condominioId, String subFolder) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String objectKey = String.format("%s/%s/%s%s",
            condominioId.toString(),
            subFolder,
            UUID.randomUUID().toString(),
            extension
        );

        if (isSupabase()) {
            uploadToSupabase(file, objectKey);
        } else {
            uploadToMinio(file, objectKey);
        }

        log.info("Arquivo uploaded: bucket={}, objectKey={}", defaultBucket, objectKey);
        return objectKey;
    }

    private void uploadToSupabase(MultipartFile file, String objectKey) {
        try {
            String url = getSupabaseStorageUrl() + "/object/" + defaultBucket + "/" + objectKey;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + secretKey);
            headers.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"
            ));
            headers.set("x-upsert", "true");

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException("Erro no upload para Supabase: " + response.getStatusCode());
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao fazer upload para Supabase: {}", e.getMessage());
            throw new BusinessException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    private void uploadToMinio(MultipartFile file, String objectKey) {
        try {
            // Fallback: usa MinIO client para ambientes locais
            io.minio.MinioClient minioClient = io.minio.MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region(region)
                .build();

            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(io.minio.PutObjectArgs.builder()
                    .bucket(defaultBucket)
                    .object(objectKey)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
            }
        } catch (Exception e) {
            log.error("Erro ao fazer upload para MinIO: {}", e.getMessage());
            throw new BusinessException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    /**
     * Baixa um arquivo
     */
    public InputStream downloadFile(String objectKey) {
        return downloadFile(defaultBucket, objectKey);
    }

    public InputStream downloadFile(String bucketName, String objectKey) {
        if (isSupabase()) {
            return downloadFromSupabase(bucketName, objectKey);
        } else {
            return downloadFromMinio(bucketName, objectKey);
        }
    }

    private InputStream downloadFromSupabase(String bucketName, String objectKey) {
        try {
            String url = getSupabaseStorageUrl() + "/object/" + bucketName + "/" + objectKey;
            log.info("Supabase download URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + secretKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);

            if (response.getBody() == null) {
                throw new BusinessException("Arquivo vazio");
            }
            return new ByteArrayInputStream(response.getBody());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao baixar do Supabase: {}", e.getMessage());
            throw new BusinessException("Erro ao baixar arquivo: " + e.getMessage());
        }
    }

    private InputStream downloadFromMinio(String bucketName, String objectKey) {
        try {
            io.minio.MinioClient minioClient = io.minio.MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region(region)
                .build();

            return minioClient.getObject(io.minio.GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
        } catch (Exception e) {
            log.error("Erro ao baixar do MinIO: {}", e.getMessage());
            throw new BusinessException("Erro ao baixar arquivo: " + e.getMessage());
        }
    }

    /**
     * Gera URL pública para download
     */
    public String getPresignedUrl(String objectKey, int expirationMinutes) {
        return getPresignedUrl(defaultBucket, objectKey, expirationMinutes);
    }

    public String getPresignedUrl(String bucketName, String objectKey, int expirationMinutes) {
        if (isSupabase()) {
            // Supabase public bucket: URL direta
            String base = endpoint.replaceAll("/storage/v1/s3$", "").replaceAll("/$", "");
            if (base.contains(".storage.supabase.co")) {
                base = base.replace(".storage.supabase.co", ".supabase.co");
            }
            return base + "/storage/v1/object/public/" + bucketName + "/" + objectKey;
        } else {
            try {
                io.minio.MinioClient minioClient = io.minio.MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .region(region)
                    .build();

                return minioClient.getPresignedObjectUrl(
                    io.minio.GetPresignedObjectUrlArgs.builder()
                        .method(io.minio.http.Method.GET)
                        .bucket(bucketName)
                        .object(objectKey)
                        .expiry(expirationMinutes, java.util.concurrent.TimeUnit.MINUTES)
                        .build());
            } catch (Exception e) {
                throw new BusinessException("Erro ao gerar URL: " + e.getMessage());
            }
        }
    }

    /**
     * Remove um arquivo
     */
    public void deleteFile(String objectKey) {
        deleteFile(defaultBucket, objectKey);
    }

    public void deleteFile(String bucketName, String objectKey) {
        if (isSupabase()) {
            try {
                String url = getSupabaseStorageUrl() + "/object/" + bucketName + "/" + objectKey;
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", "Bearer " + secretKey);
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
                log.info("Arquivo removido: bucket={}, objectKey={}", bucketName, objectKey);
            } catch (Exception e) {
                log.error("Erro ao remover do Supabase: {}", e.getMessage());
                throw new BusinessException("Erro ao remover arquivo: " + e.getMessage());
            }
        } else {
            try {
                io.minio.MinioClient minioClient = io.minio.MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .region(region)
                    .build();

                minioClient.removeObject(io.minio.RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectKey)
                    .build());
                log.info("Arquivo removido: bucket={}, objectKey={}", bucketName, objectKey);
            } catch (Exception e) {
                throw new BusinessException("Erro ao remover arquivo: " + e.getMessage());
            }
        }
    }

    public boolean fileExists(String objectKey) {
        return fileExists(defaultBucket, objectKey);
    }

    public boolean fileExists(String bucketName, String objectKey) {
        if (isSupabase()) {
            try {
                String url = getSupabaseStorageUrl() + "/object/" + bucketName + "/" + objectKey;
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", "Bearer " + secretKey);
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                restTemplate.exchange(url, HttpMethod.HEAD, entity, Void.class);
                return true;
            } catch (Exception e) {
                return false;
            }
        } else {
            try {
                io.minio.MinioClient minioClient = io.minio.MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .region(region)
                    .build();
                minioClient.statObject(io.minio.StatObjectArgs.builder()
                    .bucket(bucketName).object(objectKey).build());
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }

    public String getDefaultBucket() {
        return defaultBucket;
    }
}
