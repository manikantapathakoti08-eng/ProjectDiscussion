package com.example.skillSwap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LiveNotification {
    private String id;
    private String message;
    private String type; // SUCCESS, INFO, WARNING, ERROR
    private String timestamp;
}
