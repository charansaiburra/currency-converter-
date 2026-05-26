package com.currencyconverter.security;

import com.currencyconverter.model.User;
import com.currencyconverter.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    public ApiKeyAuthenticationFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. If the request is already authenticated by the JWT Filter, bypass API key verification
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // 2. Exclude registration, login, H2 console, rate metadata, and static assets from checks
        if (path.startsWith("/api/auth/register") ||
            path.startsWith("/api/auth/login") ||
            path.startsWith("/api/currencies") ||
            path.startsWith("/api/rates") ||
            path.startsWith("/h2-console") ||
            !path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader("X-API-KEY");

        // 3. Perform database validation if API Key is supplied
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            Optional<User> userOpt = userRepository.findByApiKey(apiKey);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Invalid API Key\"}");
                return;
            }
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Missing Authentication (JWT Bearer Token or X-API-KEY header required)\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
