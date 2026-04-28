package com.example.skillSwap.repository;

import com.example.skillSwap.enums.Role;
import com.example.skillSwap.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // 🚀 Updated: Only find verified GUIDES for a specific topic
    @Query("SELECT DISTINCT u FROM User u JOIN u.topics t " +
           "WHERE u.role = 'GUIDE' AND LOWER(t) LIKE LOWER(CONCAT('%', :topic, '%'))")
    List<User> findByTopic(@Param("topic") String topic);

    // 🚀 Updated: Advanced search only returns verified GUIDES
    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.topics t " +
           "LEFT JOIN Review r ON r.reviewee = u " +
           "WHERE u.role = 'GUIDE' " + 
           "AND LOWER(t) LIKE LOWER(CONCAT('%', :topic, '%')) " +
           "GROUP BY u.id " +
           "HAVING COALESCE(AVG(r.rating), 0.0) >= :minRating")
    List<User> findByTopicAndRating(@Param("topic") String topic, @Param("minRating") Double minRating);

    List<User> findByRole(Role role);
}