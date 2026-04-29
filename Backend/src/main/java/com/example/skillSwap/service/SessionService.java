package com.example.skillSwap.service;

import com.example.skillSwap.dto.AvailabilityDTO;
import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.dto.UserDashboardDTO;
import com.example.skillSwap.dto.UserResponse;
import com.example.skillSwap.enums.Role;
import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.mapper.SessionMapper;
import com.example.skillSwap.model.*;
import com.example.skillSwap.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;

    @Transactional
    public Session createProjectRequest(Long availabilityId, String topicName, User student) {
        // 1. One meeting per day limit
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
        long sessionsToday = sessionRepository.countStudentSessionsInDay(student, startOfDay, endOfDay);
        if (sessionsToday >= 1) {
            throw new ApiException("Daily Limit Reached: Each student can join only one meeting per day to ensure everyone gets a chance.");
        }

        Availability window = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ApiException("Availability window not found"));

        if (window.getEndTime().isBefore(LocalDateTime.now())) {
            throw new ApiException("This availability window has already passed.");
        }

        // 2. Relationship Guard
        if (student.getRole() == com.example.skillSwap.enums.Role.STUDENT && student.getAssignedGuide() != null) {
            if (!window.getGuide().getId().equals(student.getAssignedGuide().getId())) {
                throw new ApiException("You can only book sessions with your assigned Guide: " + student.getAssignedGuide().getName());
            }
        }

        // 3. Sequential 15-min Slot Finder
        List<Session> existingSessions = sessionRepository.findSessionsInWindow(window.getGuide(), window.getStartTime(), window.getEndTime());
        
        LocalDateTime nextAvailableStart = window.getStartTime();
        // If window started in the past, start from current time
        if (nextAvailableStart.isBefore(LocalDateTime.now())) {
            nextAvailableStart = LocalDateTime.now();
        }

        for (Session existing : existingSessions) {
            // If the current gap can fit 15 mins before the next session starts
            if (nextAvailableStart.plusMinutes(15).isBefore(existing.getStartTime()) || nextAvailableStart.plusMinutes(15).isEqual(existing.getStartTime())) {
                break;
            }
            // Otherwise, jump to the end of this session and check again
            if (nextAvailableStart.isBefore(existing.getEndTime())) {
                nextAvailableStart = existing.getEndTime();
            }
        }

        LocalDateTime nextAvailableEnd = nextAvailableStart.plusMinutes(15);

        // Validation: Must fit in window
        if (nextAvailableEnd.isAfter(window.getEndTime())) {
            throw new ApiException("No more 15-minute slots available in this window. Remaining time is too short.");
        }

        // 4. Create the 15-min session
        Session session = Session.builder()
                .student(student)
                .guide(window.getGuide())
                .availability(window)
                .projectTopic(topicName)
                .startTime(nextAvailableStart)
                .endTime(nextAvailableEnd)
                .durationMinutes(15)
                .status(SessionStatus.PENDING)
                .build();

        Session saved = sessionRepository.save(session);

        // 📧 Notification: Student -> Guide
        try {
            notificationService.sendBookingEmail(saved.getGuide().getEmail(), saved.getGuide().getName(), student.getName(), topicName);
            // 🚀 WebSocket Live Notification
            notificationService.sendLiveNotification(
                saved.getGuide().getEmail(), 
                "New project discussion request from " + student.getName() + " for: " + topicName, 
                "INFO"
            );
        } catch (Exception e) { 
            System.err.println("Notification skipped: " + e.getMessage()); 
        }

        return saved;
    }

    @Transactional
    public Session acceptSession(Long sessionId, User currentUser) {
        Session session = getSession(sessionId);

        // 1. Validations
        if (!session.getGuide().getId().equals(currentUser.getId())) 
            throw new AccessDeniedException("Unauthorized");
        if (session.getStatus() != SessionStatus.PENDING) 
            throw new ApiException("Session no longer available");

        if (session.getAvailability() != null && session.getAvailability().getStartTime().isBefore(LocalDateTime.now())) {
            throw new ApiException("Invalid action: This session's scheduled time has already passed.");
        }

        // 🚀 THE MEETING LINK
        String randomId = java.util.UUID.randomUUID().toString().substring(0, 8);
        String meetingLink = "https://meet.jit.si/GuideStudent-Sess-" + session.getId() + "-" + randomId;
        
        session.setMeetingLink(meetingLink);
        session.setStatus(SessionStatus.ACCEPTED);
        
        Session saved = sessionRepository.save(session);

        // 📧 Notification: Guide -> Student
        try {
            notificationService.sendAcceptanceEmail(
                session.getStudent().getEmail(), 
                session.getStudent().getName(), 
                currentUser.getName(), 
                session.getProjectTopic()
            );
            // 🚀 WebSocket Live Notification
            notificationService.sendLiveNotification(
                session.getStudent().getEmail(), 
                "Your request for '" + session.getProjectTopic() + "' was accepted by " + currentUser.getName() + "!", 
                "SUCCESS"
            );
        } catch (Exception e) { 
            System.err.println("Acceptance Email failed: " + e.getMessage()); 
        }

        return saved;
    }

    @Transactional
    public Session processCompletion(Long sessionId, User currentUser) {
        Session session = getSession(sessionId);

        boolean isGuide = session.getGuide().getId().equals(currentUser.getId());
        boolean isStudent = session.getStudent().getId().equals(currentUser.getId());

        if (!isGuide && !isStudent) {
            throw new AccessDeniedException("Unauthorized to complete this session");
        }

        if (isGuide && session.getAvailability().getStartTime().isAfter(LocalDateTime.now())) {
            throw new ApiException("You cannot complete a session before it has started.");
        }

        if (isGuide) {
            session.setStatus(SessionStatus.GUIDE_COMPLETED);
        } else {
            session.setStatus(SessionStatus.COMPLETED);
        }

        return sessionRepository.save(session);
    }

    @Transactional
    public Session rejectOrCancelSession(Long sessionId, User currentUser) {
        Session session = getSession(sessionId);

        if (currentUser != null) {
            boolean isGuide = session.getGuide().getId().equals(currentUser.getId());
            boolean isStudent = session.getStudent().getId().equals(currentUser.getId());

            if (!isGuide && !isStudent) {
                throw new AccessDeniedException("Unauthorized");
            }
        }

        session.setStatus(SessionStatus.CANCELLED);
        
        // Release the availability slot
        if (session.getAvailability() != null) {
            Availability slot = session.getAvailability();
            slot.setBooked(false);
            availabilityRepository.save(slot);
        }

        Session saved = sessionRepository.save(session);

        // 🚀 WebSocket Live Notification
        try {
            String notifyEmail = currentUser.getId().equals(session.getGuide().getId()) 
                                ? session.getStudent().getEmail() 
                                : session.getGuide().getEmail();
            String partyName = currentUser.getName();
            notificationService.sendLiveNotification(
                notifyEmail, 
                "A session for '" + session.getProjectTopic() + "' was cancelled by " + partyName, 
                "WARNING"
            );
        } catch (Exception e) {}

        return saved;
    }



    @Transactional
    public void adminCancelSession(Long sessionId, String reason) {
        rejectOrCancelSession(sessionId, null);
    }

    private Session getSession(Long id) {
        return sessionRepository.findById(id).orElseThrow(() -> new ApiException("Session not found with id: " + id));
    }

    public List<Session> getPendingRequestsForGuide(User guide) {
        return sessionRepository.findByGuideAndStatus(guide, SessionStatus.PENDING);
    }

    public List<SessionResponseDTO> getSessionsByStatus(SessionStatus status) {
        return sessionRepository.findByStatus(status)
                .stream()
                .map(SessionMapper::toDTO)
                .toList();
    }

    public Page<Session> getAllSessions(Pageable pageable) {
        return sessionRepository.findAll(pageable);
    }

    @Transactional
    public UserDashboardDTO getUserDashboard(User user) {
        List<Session> all = sessionRepository.findAllByStudentOrGuide(user, user);
        
        List<SessionResponseDTO> reqs = all.stream()
                .filter(s -> s.getStudent().getId().equals(user.getId()))
                .map(SessionMapper::toDTO)
                .toList();
 
        List<SessionResponseDTO> ments = all.stream()
                .filter(s -> s.getGuide() != null && s.getGuide().getId().equals(user.getId()))
                .map(SessionMapper::toDTO)
                .toList();
 
        List<SessionResponseDTO> hist = all.stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED)
                .map(SessionMapper::toDTO)
                .toList();
 
        List<AvailabilityDTO> guideSlots = null;
        String guideName = null;
        List<UserResponse> myStudents = null;
 
        if (user.getRole() == Role.STUDENT && user.getAssignedGuide() != null) {
            guideName = user.getAssignedGuide().getName();
            guideSlots = availabilityRepository.findByGuideAndIsBookedFalse(user.getAssignedGuide())
                    .stream()
                    .filter(a -> a.getStartTime().isAfter(LocalDateTime.now()))
                    .map(a -> AvailabilityDTO.builder()
                            .id(a.getId())
                            .startTime(a.getStartTime())
                            .endTime(a.getEndTime())
                            .isBooked(a.isBooked())
                            .build())
                    .toList();
        }
 
        if (user.getRole() == Role.GUIDE) {
            myStudents = userRepository.findByAssignedGuide(user)
                    .stream()
                    .map(u -> UserResponse.builder()
                            .id(u.getId())
                            .name(u.getName())
                            .email(u.getEmail())
                            .registrationNumber(u.getRegistrationNumber())
                            .role(u.getRole())
                            .build())
                    .toList();
        }
 
        return UserDashboardDTO.builder()
                .myRequests(reqs)
                .myGuidanceSessions(ments)
                .completedHistory(hist)
                .assignedGuideAvailability(guideSlots)
                .assignedGuideName(guideName)
                .myStudents(myStudents)
                .build();
    }
}