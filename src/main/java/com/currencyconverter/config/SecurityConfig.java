package com.currencyconverter.config;

import com.currencyconverter.repository.UserRepository;
import com.currencyconverter.security.ApiKeyAuthenticationFilter;
import com.currencyconverter.security.JwtAuthenticationFilter;
import com.currencyconverter.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Hashing algorithm for passwords
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, 
            UserRepository userRepository,
            JwtService jwtService) throws Exception {
        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable global CORS support
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless REST APIs
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin())) // For H2 Console accessibility
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers("/api/currencies", "/api/rates").permitAll()
                .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/favicon.ico").permitAll()
                .anyRequest().authenticated()
            )
            // Register JWT Filter first, then API Key Filter
            .addFilterBefore(new JwtAuthenticationFilter(jwtService, userRepository), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new ApiKeyAuthenticationFilter(userRepository), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // In production, you can lock this down to your specific Vercel URL
        configuration.setAllowedOriginPatterns(Collections.singletonList("*")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-API-KEY", "Accept"));
        configuration.setExposedHeaders(Collections.singletonList("Authorization"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
