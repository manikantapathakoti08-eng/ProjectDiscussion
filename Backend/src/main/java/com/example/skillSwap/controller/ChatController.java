package com.example.skillSwap.controller;

import com.example.skillSwap.dto.ChatMessageDTO;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.model.ChatMessage;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.repository.ChatMessageRepository;
import com.example.skillSwap.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageDTO chatMessageDTO) {
        
        Session session = sessionRepository.findById(chatMessageDTO.getSessionId())
                .orElseThrow(() -> new ApiException("Session not found with id: " + chatMessageDTO.getSessionId()));

        ChatMessage messageToSave = ChatMessage.builder()
                .session(session)
                .senderEmail(chatMessageDTO.getSenderEmail())
                .content(chatMessageDTO.getContent())
                .timestamp(LocalDateTime.now())
                .build();

        // 1. Save to Database (This is the MAGIC feature for the admin proof!)
        ChatMessage savedMessage = chatMessageRepository.save(messageToSave);

        // Update DTO with precise DB properties
        chatMessageDTO.setId(savedMessage.getId());
        chatMessageDTO.setTimestamp(savedMessage.getTimestamp());

        // 2. Broadcast to the specific session topic
        // Frontend must subscribe to: /topic/session/{sessionId}
        messagingTemplate.convertAndSend("/topic/session/" + chatMessageDTO.getSessionId(), chatMessageDTO);
    }
}
