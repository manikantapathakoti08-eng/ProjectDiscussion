package com.example.skillSwap.service;

import com.example.skillSwap.dto.*;
import com.example.skillSwap.enums.Role;
import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.model.*;
import com.example.skillSwap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional 
public class UserService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final AvailabilityRepository availabilityRepository;

    // ---------------- 🔍 GETTERS & HELPERS ----------------
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found with email: " + email));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found with id: " + id));
    }

    // NEW: Get full profile DTO by email
    @Transactional(readOnly = true)
    public UserProfileDTO getProfileByEmail(String email) {
        User user = getUserByEmail(email);
        return getUserProfile(user.getId());
    }

    @Transactional
    public User updateBio(User user, String newBio) {
        user.setBio(newBio);
        return userRepository.save(user);
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }

    // ---------------- 👤 PROFILE & DISCOVERY ----------------
    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(Long userId) {
        User user = getUserById(userId);

        return UserProfileDTO.builder()
                .id(user.getId()).name(user.getName()).email(user.getEmail())
                .bio(user.getBio()).topics(user.getTopics())
                .build();
    }






    // 2. Updated: 'Find All' usually implies finding all Guides for discovery
    @Transactional(readOnly = true)
    public List<UserProfileDTO> getAllUserProfiles() {
        // Instead of userRepository.findAll(), use findByRole(Role.GUIDE)
        return userRepository.findByRole(Role.GUIDE).stream()
                .map(user -> getUserProfile(user.getId()))
                .toList();
    }

    // 3. Updated: Availability is for GUIDES ONLY
    public Availability addAvailability(String email, LocalDateTime start, LocalDateTime end) {
        User user = getUserByEmail(email);

        // 🛑 ROLE GUARD: Only Guides can offer time slots
        if (user.getRole() != Role.GUIDE) {
            throw new ApiException("Only verified Guides can set availability slots.");
        }

        if (start.isBefore(LocalDateTime.now())) {
            throw new ApiException("Invalid time: You cannot set availability for a past date or time.");
        }

        if (start.isAfter(end) || start.isEqual(end)) {
            throw new ApiException("Invalid time: Start time must be before end time");
        }

        return availabilityRepository.save(Availability.builder()
                .guide(user)
                .startTime(start)
                .endTime(end)
                .isBooked(false)
                .build());
    }

    @Transactional(readOnly = true)
    public List<AvailabilityDTO> getGuideAvailability(Long guideId) {
        LocalDateTime now = LocalDateTime.now();
        return availabilityRepository.findByGuideAndIsBookedFalse(getUserById(guideId)).stream()
                .filter(a -> a.getStartTime().isAfter(now))
                .map(a -> AvailabilityDTO.builder().id(a.getId()).startTime(a.getStartTime())
                        .endTime(a.getEndTime()).isBooked(a.isBooked()).build()).toList();
    }

    // ---------------- 📊 DASHBOARD STATS ----------------
    @Transactional(readOnly = true)
    public UserStatsDTO getUserStats(String email) {
        User user = getUserByEmail(email);
        
        return UserStatsDTO.builder()
                .totalSessionsAsGuide(sessionRepository.countByGuideAndStatus(user, SessionStatus.COMPLETED))
                .totalSessionsAsStudent(sessionRepository.countByStudentAndStatus(user, SessionStatus.COMPLETED))
                .build();
    }

    public UserProfileDTO updateMyProfile(String email, ProfileUpdateDTO updateDTO) {
    User user = getUserByEmail(email);
    
    // 1. Name is personal - Allowed
    if (updateDTO.getName() != null && !updateDTO.getName().isBlank()) {
        user.setName(updateDTO.getName());
    }

    // 2. Bio is personal - Allowed (Users should be able to describe themselves)
    if (updateDTO.getBio() != null) {
        user.setBio(updateDTO.getBio());
    }
    
    // 🔒 3. SKILLS ARE PROTECTED
    
    userRepository.save(user);
    
    // We return the updated profile so the frontend (React) can refresh the UI
    return getUserProfile(user.getId());
}

    // 4. NEW: Support for deleting availability slots
    public void deleteAvailability(Long slotId, String email) {
        Availability slot = availabilityRepository.findById(slotId)
                .orElseThrow(() -> new ApiException("Availability slot not found."));
        
        // Security check: Only the guide who created the slot can delete it
        if (!slot.getGuide().getEmail().equals(email)) {
            throw new ApiException("You are not authorized to delete this availability slot.");
        }
        
        // Business logic: If it's already booked, maybe prevent deletion or handle cancellation?
        // For now, let's just prevent deleting booked slots to avoid breaking existing sessions.
        if (slot.isBooked()) {
            throw new ApiException("Cannot delete a booked availability slot. Please cancel the session instead.");
        }
        
        availabilityRepository.delete(slot);
    }


}