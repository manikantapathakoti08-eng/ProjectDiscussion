package com.example.skillSwap.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsDTO {
    private long totalSessionsAsGuide;
    private long totalSessionsAsStudent;
}