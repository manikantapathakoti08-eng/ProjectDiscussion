package com.example.skillSwap.model;

import com.example.skillSwap.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_topic_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProjectTopicRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String topicName;

    @Column(nullable = false)
    private String certificateUrl;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private LocalDateTime createdAt;
    
    private String adminNotes;
}
