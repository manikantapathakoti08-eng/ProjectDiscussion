package com.example.skillSwap.controller;

import com.example.skillSwap.dto.*;
import com.example.skillSwap.model.Availability;
import com.example.skillSwap.model.User;
import com.example.skillSwap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    // 📧 NEW: Restored the email lookup endpoint
    @GetMapping("/by-email")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE')")
    public ResponseEntity<UserProfileDTO> getUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.getProfileByEmail(email));
    }


    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE')")
    public ResponseEntity<UserProfileDTO> updateProfile(@RequestBody ProfileUpdateDTO dto, Principal p) {
    return ResponseEntity.ok(userService.updateMyProfile(p.getName(), dto));
}

    @PostMapping("/change-password")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE', 'ADMIN')")
    public ResponseEntity<String> changePassword(@RequestBody PasswordDTOs.ChangePasswordRequest request, Principal p) {
        User user = userService.getUserByEmail(p.getName());

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new com.example.skillSwap.exception.ApiException("Incorrect old password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.saveUser(user);

        return ResponseEntity.ok("Password updated successfully");
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserProfileDTO>> searchGuides(@RequestParam String skill, Principal p) {
        User user = userService.getUserByEmail(p.getName());
        if (user.getRole() == com.example.skillSwap.enums.Role.STUDENT && user.getAssignedGuide() != null) {
            UserProfileDTO profile = userService.getUserProfile(user.getAssignedGuide().getId());
            return ResponseEntity.ok(List.of(profile));
        }
        return ResponseEntity.ok(List.of()); // Returns empty list if no assigned guide, search is disabled
    }



    @GetMapping("/all-profiles")
    public ResponseEntity<List<UserProfileDTO>> getAllProfiles(Principal p) {
        User user = userService.getUserByEmail(p.getName());
        if (user.getRole() == com.example.skillSwap.enums.Role.STUDENT && user.getAssignedGuide() != null) {
            return ResponseEntity.ok(List.of(userService.getUserProfile(user.getAssignedGuide().getId())));
        }
        return ResponseEntity.ok(userService.getAllUserProfiles());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('STUDENT', 'GUIDE')")
    public ResponseEntity<UserStatsDTO> getMyStats(Principal p) {
        return ResponseEntity.ok(userService.getUserStats(p.getName()));
    }

    @PostMapping("/availability")
    @PreAuthorize("hasRole('GUIDE')") // 🔒 Only verified Guides can set slots!
    public ResponseEntity<String> setAvailability(@RequestBody AvailabilityDTO dto, Principal p) {
        Availability slot = userService.addAvailability(p.getName(), dto.getStartTime(), dto.getEndTime());
        return ResponseEntity.ok("Time slot added! ID: " + slot.getId());
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<AvailabilityDTO>> getGuideAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getGuideAvailability(id));
    }

    @DeleteMapping("/availability/{id}")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<String> deleteAvailability(@PathVariable Long id, Principal p) {
        userService.deleteAvailability(id, p.getName());
        return ResponseEntity.ok("Availability slot deleted successfully.");
    }
}