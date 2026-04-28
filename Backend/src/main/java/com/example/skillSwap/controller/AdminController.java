package com.example.skillSwap.controller;

import com.example.skillSwap.dto.AdminActivityResponse;
import com.example.skillSwap.dto.GuideRequestDTO;
import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.dto.UserResponse;
import com.example.skillSwap.enums.RequestStatus;
import com.example.skillSwap.model.GuideRequest;
import com.example.skillSwap.repository.GuideRequestRepository;
import com.example.skillSwap.service.AdminService;
import com.example.skillSwap.service.SessionService;
import com.example.skillSwap.service.ProjectTopicRequestService;
import com.example.skillSwap.model.ProjectTopicRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Secures the entire controller
public class AdminController {

    private final AdminService adminService;
    private final GuideRequestRepository guideRequestRepository;
    private final SessionService sessionService;
    private final ProjectTopicRequestService projectTopicRequestService;

    // 👥 View all users (Paginated)
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    

    // 📜 View system logs (Paginated)
    @GetMapping("/activities")
    public ResponseEntity<Page<AdminActivityResponse>> getAllActivities(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllActivities(pageable));
    }

    // 🎟️ 🌟 View EVERY session in the system (Fixed!)
    @GetMapping("/sessions")
    public ResponseEntity<Page<SessionResponseDTO>> getAllSessions(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllSessions(pageable));
    }

    // 🛑 NEW: Force Cancel a Session (Triggers Refunds & Emails)
    @PostMapping("/sessions/{id}/cancel")
    public ResponseEntity<String> forceCancelSession(
            @PathVariable Long id, 
            @RequestParam String reason) {
        
        // FIXED: Now correctly calling adminForceCancel to match your AdminService
        adminService.adminForceCancel(id, reason); 
        
        return ResponseEntity.ok("Session " + id + " cancelled successfully. Both parties notified.");
    }

    // 🕵️ View Chat History for a Session (Dispute Proof!)
    @GetMapping("/sessions/{id}/chat")
    public ResponseEntity<List<com.example.skillSwap.dto.ChatMessageDTO>> getSessionChatHistory(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getChatHistoryForSession(id));
    }

    // 🚨 NEW: Dedicated endpoint for active disputes (Bypasses regular pagination)
    @GetMapping("/sessions/disputed")
    public ResponseEntity<List<SessionResponseDTO>> getDisputedSessions() {
        return ResponseEntity.ok(sessionService.getSessionsByStatus(com.example.skillSwap.enums.SessionStatus.DISPUTED));
    }


   
    
// ---------------- GUIDE VERIFICATION ----------------

// 1. View the Queue: "Who wants to be a guide?"
@GetMapping("/requests/pending")
public ResponseEntity<List<GuideRequestDTO>> getPendingRequests() {
    return ResponseEntity.ok(adminService.getPendingGuideRequests());
}

    // 2. Approve: "The certificates look good!"
    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<String> approveRequest(
            @PathVariable Long id, 
            @RequestParam String adminNotes) {
        
        adminService.approveGuideRequest(id, adminNotes);
        return ResponseEntity.ok("User successfully promoted to GUIDE. Bio and Project Topics updated.");
    }

    // 3. Reject: "Proof is missing or fake."
    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<String> rejectRequest(
            @PathVariable Long id, 
            @RequestParam String adminNotes) {
        
        adminService.rejectGuideRequest(id, adminNotes);
        return ResponseEntity.ok("Guide application rejected.");
    }


    @PostMapping("/sessions/{id}/resolve")
    public ResponseEntity<String> resolveDispute(
            @PathVariable Long id, 
            @RequestParam boolean faultIsGuide, 
            @RequestParam String adminNotes) {
        
        sessionService.resolveDispute(id, faultIsGuide, adminNotes);
        
        String message = faultIsGuide ? "Fault attributed to Guide." : "Fault attributed to Student.";
        return ResponseEntity.ok("Dispute Resolved: " + message);
    }

    @GetMapping("/project-requests")
    public ResponseEntity<List<ProjectTopicRequest>> getPendingProjectRequests() {
        return ResponseEntity.ok(projectTopicRequestService.getPendingRequests());
    }

    @PostMapping("/project-requests/{requestId}/approve")
    public ResponseEntity<String> approveProjectRequest(
            @PathVariable Long requestId, 
            @RequestParam String adminNotes) {
        projectTopicRequestService.approveTopicRequest(requestId, adminNotes);
        return ResponseEntity.ok("Topic approved and added to guide profile.");
    }

    @PostMapping("/project-requests/{requestId}/reject")
    public ResponseEntity<String> rejectProjectRequest(
            @PathVariable Long requestId, 
            @RequestParam String adminNotes) {
        projectTopicRequestService.rejectTopicRequest(requestId, adminNotes);
        return ResponseEntity.ok("Topic request rejected.");
    }
}