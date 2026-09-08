package com.civicos.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Dezactivam CSRF - aplicatie REST stateless, nu are nevoie de CSRF
            .csrf(csrf -> csrf.disable())
            // Folosim configuratia CORS definita in bean-ul de mai jos
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Permitam toate requesturile OPTIONS (CORS preflight)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Permitam toate endpoint-urile API si H2 console fara autentificare
                .requestMatchers("/api/**", "/error", "/h2-console/**").permitAll()
                // Orice altceva necesita autentificare
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Acceptam orice origin localhost (dev) - pattern cu wildcard
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://10.*.*.*:*",
            "http://172.*.*.*:*"
        ));

        // Toate metodele HTTP necesare
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Toate headerele (Content-Type, Authorization etc.)
        config.setAllowedHeaders(List.of("*"));

        // Expunem headerele relevante catre frontend
        config.setExposedHeaders(List.of("Authorization", "Content-Type", "X-Total-Count"));

        // Permitam cookies/credentials
        config.setAllowCredentials(true);

        // Cache preflight 1 ora
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}