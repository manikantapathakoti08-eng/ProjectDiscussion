package com.example.skillSwap.dto;

import com.example.skillSwap.enums.RequestStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class GuideRequestDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String certificateUrl;
    private String proposedBio;
    private List<String> proposedTopics;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private String adminNotes;
}