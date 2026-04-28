package com.example.skillSwap.controller;

import com.example.skillSwap.dto.GuideApplicationDTO;
import com.example.skillSwap.model.GuideRequest;
import com.example.skillSwap.model.User;
import com.example.skillSwap.enums.RequestStatus;
import com.example.skillSwap.repository.GuideRequestRepository;
import com.example.skillSwap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/guide")
@RequiredArgsConstructor
public class ApplicationController {

    private final GuideRequestRepository guideRequestRepository;
    private final UserService userService;

    private static final String UPLOAD_DIR = "uploads/";

    @PostMapping("/upload")
    public ResponseEntity<String> uploadCertificate(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("Please select a file to upload.");

        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.write(path, file.getBytes());

            return ResponseEntity.ok("/uploads/" + fileName);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload: " + e.getMessage());
        }
    }

    @PostMapping("/apply")
    public ResponseEntity<String> applyToBeGuide(Principal principal, @RequestBody GuideApplicationDTO dto) {
        User user = userService.getUserByEmail(principal.getName());

        if (guideRequestRepository.existsByUserAndStatus(user, RequestStatus.PENDING)) {
            return ResponseEntity.badRequest().body("You already have a pending application. Please wait for Admin review.");
        }

        GuideRequest request = GuideRequest.builder()
                .user(user)
                .certificateUrl(dto.getCertificateUrl())
                .proposedBio(dto.getProposedBio())
                .proposedTopics(dto.getProposedTopics())
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        guideRequestRepository.save(request);
        return ResponseEntity.ok("Application submitted successfully! An Admin will review your certificates shortly.");
    }
}