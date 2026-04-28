package com.example.skillSwap.model;

import com.example.skillSwap.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "guide_id", nullable = true) 
    private User guide;

    // 🔗 ADD THIS FIELD: Link to the specific time slot
    @ManyToOne
    @JoinColumn(name = "availability_id")
    private Availability availability;

    // 🚀 NEW: Just a simple String! No more MasterSkill table.
    @Column(name = "topic_name", nullable = false)
    private String projectTopic;

    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SessionStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = SessionStatus.PENDING;
        }
    }
    
    @Builder.Default
    @Column(name = "reminder_sent", nullable = false, columnDefinition = "boolean default false")
    private boolean reminderSent = false;


    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(columnDefinition = "TEXT") // TEXT allows for long explanations
    private String adminNotes;

    private String disputedBy;

    private String guideProofNotes; // Guide writes: "Explained project architecture for 50 mins"

    private LocalDateTime guideJoinedAt;

    private LocalDateTime studentJoinedAt;

    private LocalDateTime guideLastHeartbeatAt;

    private LocalDateTime studentLastHeartbeatAt;

    @Column(columnDefinition = "TEXT")
    private String disputeReason;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL)
    private Review review;
}