package com.example.skillSwap.dto;

import com.example.skillSwap.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class UserDashboardDTO {
    private List<SessionResponseDTO> myRequests;    // Sessions where I am Student
    private List<SessionResponseDTO> myGuidanceSessions; // Sessions where I am Guide
    private List<SessionResponseDTO> completedHistory; // Finished sessions
    private RequestStatus guideStatusChange;
    private String guideStatusNotes;
}