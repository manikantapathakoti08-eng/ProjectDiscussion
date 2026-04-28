package com.example.skillSwap.controller;

import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.dto.UserDashboardDTO;
import com.example.skillSwap.mapper.SessionMapper;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.model.User;
import com.example.skillSwap.service.SessionService;
import com.example.skillSwap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final UserService userService;

    // 1️⃣ BOOK/REQUEST
    @PostMapping("/request/{availabilityId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SessionResponseDTO> createProjectRequest(
            @PathVariable Long availabilityId,
            @RequestParam String topicName, 
            Principal principal) {
        User student = userService.getUserByEmail(principal.getName());
        Session session = sessionService.createProjectRequest(availabilityId, topicName, student);
        return ResponseEntity.ok(SessionMapper.toDTO(session));
    }
    
    // 2️⃣ ACCEPT
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<SessionResponseDTO> acceptSession(@PathVariable Long id, Principal principal) {
        User guide = userService.getUserByEmail(principal.getName());
        Session updatedSession = sessionService.acceptSession(id, guide);
        return ResponseEntity.ok(SessionMapper.toDTO(updatedSession));
    }

    // 3️⃣ COMPLETE
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('GUIDE', 'STUDENT')")
    public ResponseEntity<SessionResponseDTO> completeSession(@PathVariable Long id, Principal principal) {
        User currentUser = userService.getUserByEmail(principal.getName());
        Session completedSession = sessionService.processCompletion(id, currentUser);
        return ResponseEntity.ok(SessionMapper.toDTO(completedSession));
    }

    // 4️⃣ CANCEL / REJECT
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE')")
    public ResponseEntity<SessionResponseDTO> rejectOrCancelSession(@PathVariable Long id, Principal principal) {
        User currentUser = userService.getUserByEmail(principal.getName());
        Session cancelledSession = sessionService.rejectOrCancelSession(id, currentUser);
        return ResponseEntity.ok(SessionMapper.toDTO(cancelledSession));
    }

    // 5️⃣ DASHBOARDS & LISTS
    @GetMapping("/pending-requests")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<List<SessionResponseDTO>> getPendingRequests(Principal principal) {
        User guide = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(sessionService.getPendingRequestsForGuide(guide).stream()
                .map(SessionMapper::toDTO).collect(Collectors.toList()));
    }

    // Learner hits this if the Mentor no-shows
    @PostMapping("/{id}/dispute")
    public ResponseEntity<String> disputeSession(
            @PathVariable Long id, 
            @RequestParam String reason,
            Principal principal
    ) {
        sessionService.raiseDispute(id, reason, principal.getName());
        return ResponseEntity.ok("Dispute raised successfully. An Admin will review it.");
    }

    @PostMapping("/{id}/heartbeat")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE')")
    public ResponseEntity<Void> recordHeartbeat(@PathVariable Long id, Principal principal) {
        sessionService.recordHeartbeat(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE', 'ADMIN')")
    public ResponseEntity<UserDashboardDTO> getDashboard(Principal principal) {
        User user = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(sessionService.getUserDashboard(user));
    }

    @PostMapping("/{id}/join")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE')")
    public ResponseEntity<SessionResponseDTO> joinSession(@PathVariable Long id, Principal principal) {
        User user = userService.getUserByEmail(principal.getName());
        Session session = sessionService.recordJoinTime(id, user);
        return ResponseEntity.ok(SessionMapper.toDTO(session));
    }
}