package com.example.skillSwap.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which session is this review for?
    @OneToOne
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    // Who wrote the review? (The Student)
    @ManyToOne
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    // Who is being reviewed? (The Guide)
   
    // Change "mentor_id" back to "reviewee_id" to satisfy the DB constraint
    @ManyToOne
    @JoinColumn(name = "reviewee_id", nullable = false) 
    private User reviewee;

    
    @Column(nullable = false)
    private int rating; 

    @Column(length = 500)
    private String comment; 

    private LocalDateTime timestamp;
}