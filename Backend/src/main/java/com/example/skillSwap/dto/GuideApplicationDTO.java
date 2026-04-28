package com.example.skillSwap.dto;

import lombok.Data;
import java.util.List;

@Data
public class GuideApplicationDTO {
    private String certificateUrl;
    private String proposedBio;
    private List<String> proposedTopics;
}