package com.condocompare.common.config;

import org.springframework.context.annotation.Configuration;

/**
 * Storage configuration.
 * MinioService handles both MinIO and Supabase Storage internally.
 * No MinioClient bean needed - service creates clients on demand.
 */
@Configuration
public class MinioConfig {
    // MinioService handles all storage operations internally
}
