package com.example.skillSwap.enums;

public enum SessionStatus {
    PENDING,    // Request is visible in the marketplace
    ACCEPTED,   // A guide has joined; chat environment is active
    COMPLETED,  
    REJECTED,   // Guide backed out of an accepted session
    CANCELLED,  // Student deleted their request before completion
    DISPUTED,   // 🚀 NEW: Student reports a problem
    REFUNDED,
    GUIDE_COMPLETED, 
    STUDENT_COMPLETED   
}