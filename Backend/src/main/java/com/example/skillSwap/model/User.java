package com.example.skillSwap.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.example.skillSwap.enums.Role;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_user_email", columnList = "email")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Column(unique = true)
    private String registrationNumber; // Unique ID for Admin/Guide/Student

    private String phoneNumber;

    private boolean mustChangePassword = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_guide_id")
    private User assignedGuide;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private String bio; 

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "user_profile_topics", 
        joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(name = "topic_name")
    private List<String> topics;
}