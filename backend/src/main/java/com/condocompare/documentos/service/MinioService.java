package com.condocompare.documentos.service;

import com.condocompare.common.exception.BusinessException;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String defaultBucket;

    /**
     * Inicializa o bucket se não existir
     */
    public void ensureBucketExists(String bucketName) {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                .bucket(bucketName)
                .build());

            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder()
                    .bucket(bucketName)
                    .build());
                log.info("Bucket criado: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("Erro ao verificar/criar bucket: {}", bucketName, e);
            throw new BusinessException("Erro ao inicializar storage: " + e.getMessage());
        }
    }

    /**
     * Faz upload de um arquivo para o MinIO
     * @return objectKey (caminho do arquivo no bucket)
     */
    public String uploadFile(MultipartFile file, UUID condominioId, String subFolder) {
        ensureBucketExists(defaultBucket);

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Gera nome único para o arquivo
        String objectKey = String.format("%s/%s/%s%s",
            condominioId.toString(),
            subFolder,
            UUID.randomUUID().toString(),
            extension
        );

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                .bucket(defaultBucket)
                .object(objectKey)
                .stream(inputStream, file.getSize(), -1)
                .contentType(file.getContentType())
                .build());

            log.info("Arquivo uploaded: bucket={}, objectKey={}", defaultBucket, objectKey);
            return objectKey;

        } catch (Exception e) {
            log.error("Erro ao fazer upload do arquivo", e);
            throw new BusinessException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    /**
     * Baixa um arquivo do MinIO
     */
    public InputStream downloadFile(String objectKey) {
        return downloadFile(defaultBucket, objectKey);
    }

    public InputStream downloadFile(String bucketName, String objectKey) {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
        } catch (Exception e) {
            log.error("Erro ao baixar arquivo: bucket={}, objectKey={}", bucketName, objectKey, e);
            throw new BusinessException("Erro ao baixar arquivo: " + e.getMessage());
        }
    }

    /**
     * Gera URL temporária para download
     */
    public String getPresignedUrl(String objectKey, int expirationMinutes) {
        return getPresignedUrl(defaultBucket, objectKey, expirationMinutes);
    }

    public String getPresignedUrl(String bucketName, String objectKey, int expirationMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucketName)
                .object(objectKey)
                .expiry(expirationMinutes, TimeUnit.MINUTES)
                .build());
        } catch (Exception e) {
            log.error("Erro ao gerar URL: bucket={}, objectKey={}", bucketName, objectKey, e);
            throw new BusinessException("Erro ao gerar URL de download: " + e.getMessage());
        }
    }

    /**
     * Remove um arquivo do MinIO
     */
    public void deleteFile(String objectKey) {
        deleteFile(defaultBucket, objectKey);
    }

    public void deleteFile(String bucketName, String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
            log.info("Arquivo removido: bucket={}, objectKey={}", bucketName, objectKey);
        } catch (Exception e) {
            log.error("Erro ao remover arquivo: bucket={}, objectKey={}", bucketName, objectKey, e);
            throw new BusinessException("Erro ao remover arquivo: " + e.getMessage());
        }
    }

    /**
     * Verifica se um arquivo existe
     */
    public boolean fileExists(String objectKey) {
        return fileExists(defaultBucket, objectKey);
    }

    public boolean fileExists(String bucketName, String objectKey) {
        try {
            minioClient.statObject(StatObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build());
            return true;
        } catch (ErrorResponseException e) {
            if (e.errorResponse().code().equals("NoSuchKey")) {
                return false;
            }
            throw new BusinessException("Erro ao verificar arquivo: " + e.getMessage());
        } catch (Exception e) {
            throw new BusinessException("Erro ao verificar arquivo: " + e.getMessage());
        }
    }

    public String getDefaultBucket() {
        return defaultBucket;
    }
}
