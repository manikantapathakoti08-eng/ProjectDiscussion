package com.example.skillSwap.mapper;

import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.model.Session;

public class SessionMapper {

    public static SessionResponseDTO toDTO(Session session) {
        String guideName = (session.getGuide() != null) 
                            ? session.getGuide().getName() 
                            : "Waiting for Guide...";

        String topicName = (session.getProjectTopic() != null)
                            ? session.getProjectTopic()
                            : "Unknown Topic";

        String studentName = (session.getStudent() != null)
                            ? session.getStudent().getName()
                            : "Unknown Student";

        return new SessionResponseDTO(
                session.getId(),
                topicName, 
                session.getDurationMinutes(),
                session.getStatus(),
                studentName, 
                guideName,
                session.getStartTime(),
                session.getEndTime(),
                session.getMeetingLink()
        );
    }
}