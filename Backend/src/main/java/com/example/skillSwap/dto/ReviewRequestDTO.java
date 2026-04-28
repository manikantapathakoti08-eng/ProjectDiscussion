package com.example.skillSwap.dto;

import lombok.Data;

@Data
public class ReviewRequestDTO {
    private int rating; // 1 to 5
    private String comment;
}