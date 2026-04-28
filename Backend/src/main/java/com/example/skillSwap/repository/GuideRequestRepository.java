package com.example.skillSwap.repository;

import com.example.skillSwap.enums.RequestStatus;
import com.example.skillSwap.model.GuideRequest;
import com.example.skillSwap.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuideRequestRepository extends JpaRepository<GuideRequest, Long> {
    
    // 🚀 Find all requests that are waiting for Admin review
    List<GuideRequest> findByStatus(RequestStatus status);

    // Check if a user already has a pending request (to prevent spam)
    boolean existsByUserAndStatus(User user, RequestStatus status);

    Optional<GuideRequest> findFirstByUserOrderByCreatedAtDesc(User user);
}