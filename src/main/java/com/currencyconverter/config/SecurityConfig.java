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
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless APIs
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
}
