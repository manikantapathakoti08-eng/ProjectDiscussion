package com.example.skillSwap.repository;

import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // 1. Marketplace: Find all requests waiting for a mentor's acceptance
    List<Session> findByStatus(SessionStatus status);

    // 2. User History: Fetch all sessions where user is either student or guide
    @Query("SELECT s FROM Session s WHERE s.student.id = :userId OR s.guide.id = :userId")
    List<Session> findAllByUserId(@Param("userId") Long userId);

    // 3. Basic query methods
    List<Session> findByGuide(User guide);
    List<Session> findByGuideAndStatus(User guide, SessionStatus status);
    List<Session> findByStudent(User student);
    Optional<Session> findByIdAndStatus(Long id, SessionStatus status);
    
    // 4. Admin Stats: Count active sessions
    long countByStatus(SessionStatus status);

    // 5. For Dashboard: Fetch all sessions for a user (both as student and guide)
    @Query("SELECT s FROM Session s WHERE s.student = :student OR s.guide = :guide")
    List<Session> findAllByStudentOrGuide(User student, User guide);

    // 6. For Scheduler: Find stale MENTOR_COMPLETED sessions
    List<Session> findByStatusAndUpdatedAtBefore(SessionStatus status, java.time.LocalDateTime time);

    long countByGuideAndStatus(User guide, SessionStatus status);
    long countByStudentAndStatus(User student, SessionStatus status);

    // 🚀 NEW: Check if student has already booked today
    @Query("SELECT COUNT(s) FROM Session s WHERE s.student = :student AND s.startTime >= :startOfDay AND s.startTime <= :endOfDay AND s.status != 'CANCELLED'")
    long countStudentSessionsInDay(@Param("student") User student, @Param("startOfDay") java.time.LocalDateTime startOfDay, @Param("endOfDay") java.time.LocalDateTime endOfDay);

    // 🚀 NEW: Find existing sessions for a guide in a window to find gaps
    @Query("SELECT s FROM Session s WHERE s.guide = :guide AND s.startTime >= :startWindow AND s.endTime <= :endWindow AND s.status != 'CANCELLED' ORDER BY s.startTime ASC")
    List<Session> findSessionsInWindow(@Param("guide") User guide, @Param("startWindow") java.time.LocalDateTime startWindow, @Param("endWindow") java.time.LocalDateTime endWindow);
}