package com.example.skillSwap.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponseDTO {
    private Long id;
    private Long sessionId;
    private String reviewerName;
    private int rating;
    private String comment;
    private LocalDateTime timestamp;
}