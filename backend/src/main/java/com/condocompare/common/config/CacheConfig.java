package com.condocompare.common.config;

import org.springframework.cache.annotation.EnableCaching;
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

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues()
            .entryTtl(Duration.ofMinutes(10));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // User cache: 30 minutes (users rarely change)
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Seguradoras cache: 1 hour (rarely changes)
        cacheConfigurations.put("seguradoras", defaultConfig.entryTtl(Duration.ofHours(1)));

        // Dashboard metrics cache: 2 minutes (frequently accessed, tolerable staleness)
        cacheConfigurations.put("dashboard-metrics", defaultConfig.entryTtl(Duration.ofMinutes(2)));

        // Dashboard charts cache: 5 minutes
        cacheConfigurations.put("dashboard-charts", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Condominio names cache: 15 minutes (used heavily in list queries)
        cacheConfigurations.put("condominio-names", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // Planos cache: 1 hour (billing plans rarely change)
        cacheConfigurations.put("planos", defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }
}
