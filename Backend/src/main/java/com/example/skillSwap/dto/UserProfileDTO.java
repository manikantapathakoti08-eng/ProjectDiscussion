package com.example.skillSwap.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class UserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String bio;          
    private List<String> topics;  

}