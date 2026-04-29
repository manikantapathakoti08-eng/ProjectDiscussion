package com.example.skillSwap.dto;

import com.example.skillSwap.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String registrationNumber;
    private Role role;
}