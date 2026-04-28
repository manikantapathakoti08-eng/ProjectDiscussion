package com.example.skillSwap.model;

import com.example.skillSwap.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "guide_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GuideRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String certificateUrl; // Link to their PDF or Proof

    @Column(columnDefinition = "TEXT")
    private String proposedBio;

    @ElementCollection
    private List<String> proposedTopics;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDateTime createdAt;
    
    private String adminNotes; // Why they were approved/rejected
}