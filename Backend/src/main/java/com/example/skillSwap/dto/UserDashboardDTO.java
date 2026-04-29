package com.example.skillSwap.dto;

import com.example.skillSwap.enums.RequestStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.util.List;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDashboardDTO {
    private List<SessionResponseDTO> myRequests;  // Sessions where I am Student
    private List<SessionResponseDTO> myGuidanceSessions; // Sessions where I am Guide
    private List<SessionResponseDTO> completedHistory; // Finished sessions
    private List<AvailabilityDTO> assignedGuideAvailability; // New: For students to see their guide's slots
    private String assignedGuideName; // New: For students to see their guide's name
    private List<UserResponse> myStudents; // New: For guides to see their assigned students
    private RequestStatus guideStatusChange;
    private String guideStatusNotes;
}