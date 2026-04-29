package com.example.skillSwap.service;

import com.example.skillSwap.dto.AdminActivityResponse;
import com.example.skillSwap.dto.OnboardingRequest;
import com.example.skillSwap.dto.SessionResponseDTO;
import com.example.skillSwap.dto.UserResponse;
import com.example.skillSwap.enums.Role;
import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.mapper.SessionMapper;
import com.example.skillSwap.model.AdminActivityLog;
import com.example.skillSwap.model.User;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.repository.AdminActivityRepository;
import com.example.skillSwap.repository.UserRepository;
import com.example.skillSwap.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AdminActivityRepository adminActivityRepository;
    private final SessionService sessionService;
    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final com.example.skillSwap.repository.ChatMessageRepository chatMessageRepository;

    // ---------------- GET USERS ----------------
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<UserResponse> getAllUsersPaged(Pageable pageable) {
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
    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }



    // ---------------- USER ONBOARDING ----------------
    @Transactional
    public User onboardUser(OnboardingRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already exists");
        }
        if (userRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new ApiException("Registration number already exists");
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .registrationNumber(request.getRegistrationNumber())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(tempPassword))
                .role(request.getRole())
                .mustChangePassword(true)
                .build();

        // Assign guide if student
        if (request.getRole() == Role.STUDENT && request.getAssignedGuideRegistrationNumber() != null) {
            User guide = userRepository.findByRegistrationNumber(request.getAssignedGuideRegistrationNumber())
                    .orElseGet(() -> {
                        try {
                            return userRepository.findById(Long.parseLong(request.getAssignedGuideRegistrationNumber()))
                                    .orElseThrow(() -> new ApiException("Assigned Guide not found with ID or registration number: " + request.getAssignedGuideRegistrationNumber()));
                        } catch (NumberFormatException e) {
                            throw new ApiException("Assigned Guide not found with registration number: " + request.getAssignedGuideRegistrationNumber());
                        }
                    });
            
            if (guide.getRole() != Role.GUIDE) {
                throw new ApiException("The assigned user is not a Guide");
            }
            user.setAssignedGuide(guide);
        }

        User savedUser = userRepository.save(user);

        // Send email
        notificationService.sendOnboardingEmail(
                savedUser.getEmail(), 
                savedUser.getName(), 
                tempPassword, 
                savedUser.getRole().name()
        );

        return savedUser;
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

    // ---------------- 🛡️ ADMIN ACTIONS ----------------

    @Transactional
    public void adminForceCancel(Long sessionId, String reason) {
        Session session = sessionService.rejectOrCancelSession(sessionId, null);

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
        userRepository.delete(user);
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
}