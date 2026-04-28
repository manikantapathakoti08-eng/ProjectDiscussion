package com.example.skillSwap.service;

import com.example.skillSwap.dto.ReviewRequestDTO;
import com.example.skillSwap.dto.ReviewResponseDTO;
import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.model.*;
import com.example.skillSwap.repository.ReviewRepository;
import com.example.skillSwap.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public ReviewResponseDTO submitReview(Long sessionId, User student, ReviewRequestDTO dto) {
        // 1. Validate the Session exists
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("Session not found"));

        // 2. Security: Only the student of the session can write the review
        if (!session.getStudent().getId().equals(student.getId())) {
            throw new ApiException("Unauthorized: Only the student can review this session.");
        }

        // 3. Prevent duplicate reviews for the same session
        if (reviewRepository.existsBySessionId(sessionId)) {
            throw new ApiException("A review has already been submitted for this session.");
        }

        // 4. Status Check: Allow review if it's ACCEPTED or COMPLETED.
        if (session.getStatus() != SessionStatus.ACCEPTED && session.getStatus() != SessionStatus.COMPLETED) {
            throw new ApiException("Cannot review a session that hasn't happened yet.");
        }

        // 5. Create Review
        Review review = Review.builder()
            .session(session)
            .reviewer(student)
            .reviewee(session.getGuide()) 
            .rating(dto.getRating())
            .comment(dto.getComment())
            .timestamp(LocalDateTime.now())
            .build();

        Review savedReview = reviewRepository.save(review);

        // 6. Return Response DTO
        return ReviewResponseDTO.builder()
                .id(savedReview.getId())
                .sessionId(sessionId)
                .reviewerName(student.getName())
                .rating(savedReview.getRating())
                .comment(savedReview.getComment())
                .timestamp(savedReview.getTimestamp())
                .build();
    }

    public java.util.List<ReviewResponseDTO> getReviewsByGuideId(Long guideId) {
        return reviewRepository.findAll().stream()
            .filter(r -> r.getReviewee().getId().equals(guideId))
            .map(r -> ReviewResponseDTO.builder()
                .id(r.getId())
                .sessionId(r.getSession().getId())
                .reviewerName(r.getReviewer().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .timestamp(r.getTimestamp())
                .build())
            .toList();
    }
}