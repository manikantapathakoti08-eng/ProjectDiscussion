package com.example.skillSwap.controller;

import com.example.skillSwap.dto.LoginRequest;
import com.example.skillSwap.dto.SignupRequest;
import com.example.skillSwap.dto.PasswordDTOs.ForgotPasswordRequest;
import com.example.skillSwap.dto.PasswordDTOs.ResetPasswordRequest;
import com.example.skillSwap.enums.ActivityType;
import com.example.skillSwap.enums.Role;
import com.example.skillSwap.exception.ApiException;
import com.example.skillSwap.model.AdminActivityLog;
import com.example.skillSwap.model.User;
import com.example.skillSwap.repository.AdminActivityRepository;
import com.example.skillSwap.repository.UserRepository;
import com.example.skillSwap.security.JwtUtil;
import com.example.skillSwap.service.NotificationService;
import com.example.skillSwap.service.RedisOtpService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AdminActivityRepository adminActivityRepository;
    private final RedisOtpService redisOtpService;
    private final NotificationService notificationService;

    // ---------------- SIGNUP (DISABLED) ----------------
    @PostMapping("/signup")
    @Transactional
    public ResponseEntity<String> signup(
            @Valid @RequestBody SignupRequest signupRequest
    ) {
        throw new ApiException("Public registration is disabled. Please contact an Administrator.");
    }

    // ---------------- LOGIN ----------------
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest loginRequest
    ) {

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ApiException("User not found"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new ApiException("Invalid password");
        }

        // 🚀 NEW: Generate BOTH tokens
        String accessToken = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // Log login activity
        adminActivityRepository.save(
                new AdminActivityLog(ActivityType.LOGIN, user)
        );

        // 🚀 UPDATE: Return tokens and mustChangePassword flag
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "mustChangePassword", user.isMustChangePassword()
        ));
    }

    // ---------------- REFRESH TOKEN ----------------
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        if (refreshToken == null || jwtUtil.isTokenExpired(refreshToken)) {
            throw new ApiException("Refresh token is missing or expired. Please login again.");
        }

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found"));

        // Generate a fresh Access Token
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "refreshToken", refreshToken // Send back the same valid refresh token
        ));
    }
    
        // ---------------- PROFILE ----------------
   @GetMapping("/profile")
        public ResponseEntity<?> getProfile(Authentication authentication) {

         if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("User not authenticated");
         }

        String email = authentication.getName();

         User user = userRepository.findByEmail(email)
                   .orElseThrow(() -> new ApiException("User not found"));

         return ResponseEntity.ok(Map.of(
                  "id", user.getId(),
                  "name", user.getName(),
                  "email", user.getEmail(),
                  "role", user.getRole().name(),
                  "createdAt", user.getCreatedAt()
         ));
        }

    // ---------------- FORGOT PASSWORD (Generate OTP) ----------------
    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("User not found with that email"));

        // Generate 6-digit random OTP and store in Redis
        String otp = redisOtpService.generateAndStoreOtp(user.getEmail());

        // Send Email
        notificationService.sendOtpEmail(user.getEmail(), otp);

        return ResponseEntity.ok("OTP sent to your email successfully");
    }

    // ---------------- RESET PASSWORD (Verify OTP & Change) ----------------
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean isValid = redisOtpService.validateOtp(request.getEmail(), request.getOtp());

        if (!isValid) {
            throw new ApiException("Invalid or expired OTP. Please request a new one.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("Password has been reset successfully. You can now login.");
    }

    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (authentication == null) throw new ApiException("Unauthorized");
        
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new ApiException("Old password does not match");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully");
    }
}