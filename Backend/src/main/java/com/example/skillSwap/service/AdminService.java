package com.example.skillSwap.service;

import com.example.skillSwap.dto.AdminActivityResponse;
import com.example.skillSwap.dto.GuideRequestDTO;
import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.dto.UserResponse;
import com.example.skillSwap.mapper.SessionMapper;
import com.example.skillSwap.model.AdminActivityLog;
import com.example.skillSwap.model.GuideRequest;
import com.example.skillSwap.model.User;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.enums.RequestStatus;
import com.example.skillSwap.enums.Role;
import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.repository.AdminActivityRepository;
import com.example.skillSwap.repository.GuideRequestRepository;
import com.example.skillSwap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AdminActivityRepository adminActivityRepository;
    private final SessionService sessionService;
    private final NotificationService notificationService;
    private final GuideRequestRepository guideRequestRepository;
    private final com.example.skillSwap.repository.ChatMessageRepository chatMessageRepository;

    // ---------------- GUIDE REQUESTS ----------------
    
    @Transactional(readOnly = true)
    public List<GuideRequestDTO> getPendingGuideRequests() {
        return guideRequestRepository.findByStatus(RequestStatus.PENDING)
                .stream()
                .map(this::mapToGuideRequestDTO)
                .collect(Collectors.toList());
    }

    // ---------------- GET USERS ----------------
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::mapToUserResponse);
    }

    // ---------------- GET ACTIVITIES ----------------
    @Transactional(readOnly = true)
    public Page<AdminActivityResponse> getAllActivities(Pageable pageable) {
        return adminActivityRepository.findAll(pageable)
                .map(this::mapToActivityResponse);
    }

    // ---------------- GET ALL SESSIONS ----------------
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<SessionResponseDTO> getAllSessions(org.springframework.data.domain.Pageable pageable) {
        return sessionService.getAllSessions(pageable).map(SessionMapper::toDTO);
    }

    // ---------------- GET CHAT HISTORY ----------------
    @Transactional(readOnly = true)
    public List<com.example.skillSwap.dto.ChatMessageDTO> getChatHistoryForSession(Long sessionId) {
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId)
                .stream()
                .map(msg -> com.example.skillSwap.dto.ChatMessageDTO.builder()
                        .id(msg.getId())
                        .sessionId(msg.getSession().getId())
                        .senderEmail(msg.getSenderEmail())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    // ---------------- 🛡️ ADMIN ACTIONS (NEW REQUIREMENTS) ----------------

    @Transactional
    public void adminForceCancel(Long sessionId, String reason) {
        // We reuse the sessionService logic to handle status update
        Session session = sessionService.rejectOrCancelSession(sessionId, null);

        // 📧 Trigger Notifications for both parties
        notificationService.sendCancellationEmail(
            session.getStudent().getEmail(), 
            "System Administrator", 
            "Admin Cancellation: " + reason
        );
        
        notificationService.sendCancellationEmail(
            session.getGuide().getEmail(), 
            "System Administrator", 
            "Admin Cancellation: " + reason
        );
    }

    @Transactional
    public void deleteUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Safety check: Don't delete users with active/accepted sessions
        userRepository.delete(user);
    }

    @Transactional
    public void approveGuideRequest(Long requestId, String adminNotes) {
        GuideRequest request = guideRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Guide Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new ApiException("This request has already been processed.");
        }

        // 1. Update Request Status
        request.setStatus(RequestStatus.APPROVED);
        request.setAdminNotes(adminNotes);

        // 2. Promote the User
        User user = request.getUser();
        user.setRole(Role.GUIDE); 
        user.setBio(request.getProposedBio());
        user.setTopics(new ArrayList<>(request.getProposedTopics()));

        userRepository.save(user);
        guideRequestRepository.save(request);
    }

    // 🚀 NEW: Admin Rejection Logic
    @Transactional
    public void rejectGuideRequest(Long requestId, String adminNotes) {
        GuideRequest request = guideRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Guide Request not found"));

        request.setStatus(RequestStatus.REJECTED);
        request.setAdminNotes(adminNotes);
        
        guideRequestRepository.save(request);
    }
    // ---------------- MAPPERS ----------------
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private AdminActivityResponse mapToActivityResponse(AdminActivityLog log) {
        return AdminActivityResponse.builder()
                .id(log.getId())
                .action(log.getActivityType().name())
                .timestamp(log.getTimestamp())
                .performedBy(log.getUser().getEmail())
                .build();
    }

    private GuideRequestDTO mapToGuideRequestDTO(GuideRequest request) {
        return GuideRequestDTO.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userName(request.getUser().getName())
                .userEmail(request.getUser().getEmail())
                .certificateUrl(request.getCertificateUrl())
                .proposedBio(request.getProposedBio())
                .proposedTopics(new ArrayList<>(request.getProposedTopics()))
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .adminNotes(request.getAdminNotes())
                .build();
    }


}