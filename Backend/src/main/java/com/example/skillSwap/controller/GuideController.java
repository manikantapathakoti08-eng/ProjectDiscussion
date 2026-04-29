package com.example.skillSwap.controller;

import com.example.skillSwap.model.User;
import com.example.skillSwap.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/guide")
@RequiredArgsConstructor
public class GuideController {

    private final UserService userService;



    @PutMapping("/profile/bio")
    @PreAuthorize("hasRole('GUIDE')")
    public ResponseEntity<User> updateBio(@RequestBody String bio, Principal principal) {
        User guide = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(userService.updateBio(guide, bio));
    }
}
