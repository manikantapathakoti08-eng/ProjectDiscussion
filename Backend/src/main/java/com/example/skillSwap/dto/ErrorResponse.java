package com.example.skillSwap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor // Added for better JSON compatibility
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;   // 🚀 ADDED THIS
    private String message;
    private String path;
}