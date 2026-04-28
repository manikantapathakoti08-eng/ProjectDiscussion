package com.example.skillSwap.config;

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
        // Enable a simple memory-based message broker
        // /topic is for public/broadcast messages
        // /queue is for private user-specific messages
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages being sent FROM client TO server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific messaging (for @SendToUser)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The endpoint that the frontend will connect to
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins for development/Cloudflare
                .withSockJS();
    }
}
