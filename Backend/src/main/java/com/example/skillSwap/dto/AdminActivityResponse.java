package com.example.skillSwap.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminActivityResponse {

    private Long id;
    private String action;
    private String performedBy;
    private LocalDateTime timestamp;
}