package com.example.skillSwap.controller;

import com.example.skillSwap.model.ProjectTopicRequest;
import com.example.skillSwap.model.User;
import com.example.skillSwap.service.ProjectTopicRequestService;
import com.example.skillSwap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/guide")
@RequiredArgsConstructor
public class GuideController {

    private final ProjectTopicRequestService projectTopicRequestService;
    private final UserService userService;

    @PostMapping("/request-project")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<ProjectTopicRequest> requestProject(
            @RequestParam String topicName,
            @RequestParam String certificateUrl,
            Principal principal) {
        User guide = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(projectTopicRequestService.createTopicRequest(guide, topicName, certificateUrl));
    }

    @GetMapping("/project-requests")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<List<ProjectTopicRequest>> getMyProjectRequests(Principal principal) {
        User guide = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(projectTopicRequestService.getUserRequests(guide.getId()));
    }

    @PutMapping("/profile/bio")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<User> updateBio(@RequestBody String bio, Principal principal) {
        User guide = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(userService.updateBio(guide, bio));
    }
}
