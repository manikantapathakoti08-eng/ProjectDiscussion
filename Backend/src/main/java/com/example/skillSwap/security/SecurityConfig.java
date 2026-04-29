package com.example.skillSwap.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // 🚀 YOU MISSED THIS LINE!
                .csrf(csrf -> csrf.disable()) // Disabled for stateless JWT APIs
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))

                // Inside your filterChain method in SecurityConfig.java

                .authorizeHttpRequests(auth -> auth
                        // 1. Public Auth Endpoints
                        .requestMatchers("/auth/login", "/auth/signup", "/auth/refresh", "/auth/forgot-password",
                                "/auth/reset-password")
                        .permitAll()

                        // 🚀 NEW: Swagger & OpenAPI Public Access
                        // 🚀 The Bulletproof Swagger Whitelist
                        .requestMatchers(
                                "/api-docs", // <--- ADD THIS (Exact match for the handshake)
                                "/api-docs/**", // (Matches the background config files)
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/error")
                        .permitAll()

                        // 2. WebSocket Handshake & Static Media
                        .requestMatchers("/ws-chat/**", "/uploads/**").permitAll()

                        // 3. Admin Only Endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 4. All other requests
                        .anyRequest().authenticated())

                // Add the JWT filter before the standard UsernamePassword filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Higher strength (12) for production security
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 🚀 Allow all origins to resolve CORS preflight issues
        configuration.setAllowedOriginPatterns(List.of("*"));

        // Allow all standard HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Allow all common headers
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control", "Accept", "X-Requested-With", "Origin"));

        // Essential if you want the frontend to remember the user's login state
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}