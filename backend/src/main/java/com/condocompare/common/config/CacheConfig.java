package com.condocompare.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        try {
            connectionFactory.getConnection().ping();
            log.info("Redis available - using Redis cache");
            return redisCacheManager(connectionFactory);
        } catch (Exception e) {
            log.warn("Redis unavailable - using in-memory cache");
            return new ConcurrentMapCacheManager();
        }
    }

    private RedisCacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues()
            .entryTtl(Duration.ofMinutes(10));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("seguradoras", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("dashboard-metrics", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigurations.put("dashboard-charts", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("condominio-names", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put("planos", defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }
}
