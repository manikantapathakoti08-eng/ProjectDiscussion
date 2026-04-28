package com.example.skillSwap.service;

import com.example.skillSwap.enums.RequestStatus;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.model.ProjectTopicRequest;
import com.example.skillSwap.model.User;
import com.example.skillSwap.repository.ProjectTopicRequestRepository;
import com.example.skillSwap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectTopicRequestService {

    private final ProjectTopicRequestRepository projectTopicRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ProjectTopicRequest createTopicRequest(User user, String topicName, String certificateUrl) {
        ProjectTopicRequest request = ProjectTopicRequest.builder()
                .user(user)
                .topicName(topicName)
                .certificateUrl(certificateUrl)
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        return projectTopicRequestRepository.save(request);
    }

    public List<ProjectTopicRequest> getPendingRequests() {
        return projectTopicRequestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<ProjectTopicRequest> getUserRequests(Long userId) {
        return projectTopicRequestRepository.findByUserId(userId);
    }

    @Transactional
    public void approveTopicRequest(Long requestId, String adminNotes) {
        ProjectTopicRequest request = projectTopicRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Topic request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new ApiException("Only pending requests can be approved");
        }

        request.setStatus(RequestStatus.APPROVED);
        request.setAdminNotes(adminNotes);

        // Add the topic to the user's topic list (formerly skills)
        User user = request.getUser();
        if (!user.getTopics().contains(request.getTopicName())) {
            user.getTopics().add(request.getTopicName());
            userRepository.save(user);
        }

        projectTopicRequestRepository.save(request);

        // 🚀 WebSocket Live Notification
        notificationService.sendLiveNotification(
            user.getEmail(), 
            "Congratulations! Your topic request for '" + request.getTopicName() + "' has been APPROVED.", 
            "SUCCESS"
        );
    }

    @Transactional
    public void rejectTopicRequest(Long requestId, String adminNotes) {
        ProjectTopicRequest request = projectTopicRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Topic request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new ApiException("Only pending requests can be rejected");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setAdminNotes(adminNotes);
        projectTopicRequestRepository.save(request);

        // 🚀 WebSocket Live Notification
        notificationService.sendLiveNotification(
            request.getUser().getEmail(), 
            "Notice: Your topic request for '" + request.getTopicName() + "' has been rejected. Reason: " + adminNotes, 
            "ERROR"
        );
    }
}
