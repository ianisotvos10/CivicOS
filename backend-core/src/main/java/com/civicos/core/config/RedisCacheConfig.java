package com.civicos.core.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configurare Redis Cache pentru CivicOS.
 * Defineste TTL-uri diferentiate per cache:
 *  - "taxes"     → 5 minute (se schimba la plata/contestatie — evict automat)
 *  - "documents" → 10 minute (imutabile dupa emitere)
 *  - "polls"     → 2 minute (se actualizeaza la vot)
 *  - "alerts"    → 3 minute (sesizari urbane)
 *  - "services"  → 5 minute (cererile cetatenilor)
 */
@Configuration
public class RedisCacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {

        // Configurare implicita: TTL 5 minute, serializare JSON
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.string()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.json()))
                .disableCachingNullValues();

        // TTL-uri personalizate per cache
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("taxes",     defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigs.put("documents", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("polls",     defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("alerts",    defaultConfig.entryTtl(Duration.ofMinutes(3)));
        cacheConfigs.put("services",  defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}
