package com.example.skillSwap.controller;

import com.example.skillSwap.model.User;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.service.AdminService;
import com.example.skillSwap.service.ProjectTopicRequestService;
import com.example.skillSwap.model.ProjectTopicRequest;
import com.example.skillSwap.dto.OnboardingRequest;
import com.example.skillSwap.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;
    private final ProjectTopicRequestService projectTopicRequestService;

    @Autowired
    public AdminController(AdminService adminService, ProjectTopicRequestService projectTopicRequestService) {
        this.adminService = adminService;
        this.projectTopicRequestService = projectTopicRequestService;
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsersPaged(pageable));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<Session>> getAllSessions() {
        return ResponseEntity.ok(adminService.getAllSessions());
    }

    @GetMapping("/sessions/disputed")
    public ResponseEntity<List<Session>> getDisputedSessions() {
        return ResponseEntity.ok(adminService.getDisputedSessions());
    }

    @PostMapping("/sessions/{sessionId}/resolve")
    public ResponseEntity<String> resolveDispute(
            @PathVariable Long sessionId, 
            @RequestParam boolean faultIsGuide, 
            @RequestParam String resolutionNotes) {
        adminService.resolveDispute(sessionId, faultIsGuide, resolutionNotes);
        return ResponseEntity.ok("Dispute resolved successfully.");
    }

    // TOPIC REQUESTS (New System)
    @GetMapping("/project-requests/pending")
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

    @PostMapping("/onboard")
    public ResponseEntity<Map<String, String>> onboardUser(@Valid @RequestBody OnboardingRequest request) {
        adminService.onboardUser(request);
        return ResponseEntity.ok(Map.of("message", "User onboarded successfully"));
    }
}