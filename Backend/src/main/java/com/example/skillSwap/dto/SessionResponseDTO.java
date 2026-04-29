package com.example.skillSwap.dto;

import com.example.skillSwap.enums.SessionStatus;
import java.time.LocalDateTime;

public record SessionResponseDTO(
        Long id,
        String topicName,
        int durationMinutes,
        SessionStatus status,
        String studentName,
        String guideName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        LocalDateTime guideJoinedAt,
        LocalDateTime studentJoinedAt,
        LocalDateTime guideLastHeartbeatAt,
        LocalDateTime studentLastHeartbeatAt,
        String disputeReason,
        String meetingLink
) {}