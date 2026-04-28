package com.example.skillSwap.controller;

import com.example.skillSwap.model.User;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.service.AdminService;
import com.example.skillSwap.service.ProjectTopicRequestService;
import com.example.skillSwap.model.ProjectTopicRequest;
import com.example.skillSwap.dto.OnboardingRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

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
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
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
    public ResponseEntity<User> onboardUser(@Valid @RequestBody OnboardingRequest request) {
        return ResponseEntity.ok(adminService.onboardUser(request));
    }
}