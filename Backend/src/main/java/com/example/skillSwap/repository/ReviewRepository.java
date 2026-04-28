package com.example.skillSwap.repository;

import com.example.skillSwap.model.Review;
import com.example.skillSwap.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByReviewee(User reviewee);
    
    boolean existsBySessionId(Long sessionId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.reviewee = :user")
    Double getAverageRatingForUser(@Param("user") User user);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.reviewee = :user")
    Long countReviewsForUser(@Param("user") User user);

    // 🚀 UPDATED: Only fetch users with Role.GUIDE at the database level
    @Query("SELECT r.reviewee FROM Review r " +
           "WHERE r.reviewee.role = com.example.skillSwap.enums.Role.GUIDE " +
           "GROUP BY r.reviewee " +
           "ORDER BY AVG(r.rating) DESC")
    List<User> findTopGuides();
}