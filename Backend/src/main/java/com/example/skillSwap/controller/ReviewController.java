package com.example.skillSwap.controller;

import com.example.skillSwap.dto.ReviewRequestDTO;
import com.example.skillSwap.dto.ReviewResponseDTO;
import com.example.skillSwap.model.User;
import com.example.skillSwap.service.ReviewService;
import com.example.skillSwap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @PostMapping("/{sessionId}/review")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ReviewResponseDTO> submitReview(
            @PathVariable Long sessionId,
            @RequestBody ReviewRequestDTO requestDTO,
            Principal principal) {
        
        // 1. Get the current logged-in user (The Student writing the review)
        User currentUser = userService.getUserByEmail(principal.getName());

        // 2. Process and save the review
        ReviewResponseDTO responseDTO = reviewService.submitReview(sessionId, currentUser, requestDTO);

        // 3. Return the saved review data with a 200 OK status
        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/guide/{guideId}/reviews")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<java.util.List<ReviewResponseDTO>> getGuideReviews(@PathVariable Long guideId) {
        return ResponseEntity.ok(reviewService.getReviewsByGuideId(guideId));
    }
}