package com.example.skillSwap.service;

import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.dto.UserDashboardDTO;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;
    private final GuideRequestRepository guideRequestRepository;

    @Transactional
    public Session createProjectRequest(Long availabilityId, String topicName, int durationHours, User student) {
        if (durationHours <= 0) throw new ApiException("Duration must be greater than zero");

        Availability slot = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ApiException("Time slot not found"));
        
        if (slot.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ApiException("Invalid time: This slot has already passed.");
        }
        
        if (slot.isBooked()) throw new ApiException("Slot already taken.");

        // Lock the slot
        slot.setBooked(true);
        availabilityRepository.save(slot);

        Session session = sessionRepository.save(Session.builder()
                .student(student)
                .guide(slot.getGuide())
                .availability(slot)
                .projectTopic(topicName)
                .durationHours(durationHours)
                .status(SessionStatus.PENDING)
                .build());

        // 📧 Notification: Student -> Guide
        try {
            notificationService.sendBookingEmail(session.getGuide().getEmail(), session.getGuide().getName(), student.getName(), topicName);
        } catch (Exception e) { 
            System.err.println("Notification skipped: " + e.getMessage()); 
        }

        return session;
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

        return sessionRepository.save(session);
    }

    @Transactional
    public void recordHeartbeat(Long sessionId, String email) {
        Session session = getSession(sessionId);
        LocalDateTime now = LocalDateTime.now();

        if (session.getGuide().getEmail().equals(email)) {
            session.setGuideLastHeartbeatAt(now);
        } else if (session.getStudent().getEmail().equals(email)) {
            session.setStudentLastHeartbeatAt(now);
        }
        sessionRepository.save(session);
    }

    @Transactional
    public Session recordJoinTime(Long sessionId, User user) {
        Session session = getSession(sessionId);
        LocalDateTime now = LocalDateTime.now();

        if (session.getGuide().getId().equals(user.getId())) {
            session.setGuideJoinedAt(now);
        } else if (session.getStudent().getId().equals(user.getId())) {
            session.setStudentJoinedAt(now);
        }
        return sessionRepository.save(session);
    }

    @Transactional
    public void raiseDispute(Long sessionId, String reason, String email) {
        Session session = getSession(sessionId);
        session.setStatus(SessionStatus.DISPUTED);
        session.setDisputeReason(reason);
        session.setDisputedBy(email);
        sessionRepository.save(session);
    }

    @Transactional
    public void resolveDispute(Long sessionId, boolean faultIsGuide, String adminNotes) {
        Session session = getSession(sessionId);

        if (session.getStatus() != SessionStatus.DISPUTED) {
            throw new ApiException("This session is not currently under dispute");
        }

        if (faultIsGuide) {
            session.setStatus(SessionStatus.REFUNDED);
        } else {
            session.setStatus(SessionStatus.COMPLETED); 
        }

        session.setAdminNotes(adminNotes); 
        sessionRepository.save(session);
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

        // 🛡️ GUIDE APPLICATION STATUS DETECTION
        com.example.skillSwap.enums.RequestStatus statusChange = null;
        String statusNotes = null;
        
        GuideRequest latestReq = guideRequestRepository.findFirstByUserOrderByCreatedAtDesc(user).orElse(null);
        if (latestReq != null && latestReq.getStatus() != com.example.skillSwap.enums.RequestStatus.PENDING) {
            if (user.getLastSeenGuideRequestStatus() != latestReq.getStatus()) {
                statusChange = latestReq.getStatus();
                statusNotes = latestReq.getAdminNotes();
                
                user.setLastSeenGuideRequestStatus(latestReq.getStatus());
                userRepository.save(user); 
            }
        }

        return new UserDashboardDTO(reqs, ments, hist, statusChange, statusNotes);
    }
}