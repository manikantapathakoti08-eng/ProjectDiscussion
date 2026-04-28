package com.example.skillSwap.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // This is where the server sends messages TO the users
        config.enableSimpleBroker("/topic");
        
        // This is the prefix for messages sent FROM users TO the server
        // Example: /app/chat/{sessionId}
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The URL the frontend will use to connect (e.g., wss://localhost:8443/ws-chat)
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // Allows frontend to connect
                .withSockJS(); // Fallback for older browsers
    }
}