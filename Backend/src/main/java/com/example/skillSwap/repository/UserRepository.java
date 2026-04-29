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

    Optional<User> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    // 🚀 Updated: Only find verified GUIDES for a specific topic
    @Query("SELECT DISTINCT u FROM User u JOIN u.topics t " +
           "WHERE u.role = 'GUIDE' AND LOWER(t) LIKE LOWER(CONCAT('%', :topic, '%'))")
    List<User> findByTopic(@Param("topic") String topic);



    List<User> findByRole(Role role);
    List<User> findByAssignedGuide(User guide);
}