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
                session.getDurationHours(),
                session.getStatus(),
                studentName, 
                guideName,
                session.getAvailability() != null ? session.getAvailability().getStartTime() : null,
                session.getGuideJoinedAt(),
                session.getStudentJoinedAt(),
                session.getGuideLastHeartbeatAt(),
                session.getStudentLastHeartbeatAt(),
                session.getDisputeReason(),
                session.getReview() != null,
                session.getMeetingLink()
        );
    }
}