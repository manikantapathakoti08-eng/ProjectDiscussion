package com.example.skillSwap.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    // Store OTP and its expiration time
    private static class OtpData {
        String code;
        LocalDateTime expiry;

        OtpData(String code, LocalDateTime expiry) {
            this.code = code;
            this.expiry = expiry;
        }
    }

    // In-memory OTP storage
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    /**
     * Generates a random 6-digit OTP, stores it in memory with a 10-minute TTL,
     * and returns the generated code.
     */
    public String generateAndStoreOtp(String email) {
        String code = String.format("%06d", new Random().nextInt(999999));
        
        // Store with 10 minutes expiry
        otpStorage.put(email, new OtpData(code, LocalDateTime.now().plusMinutes(10)));
        log.info("Stored OTP in memory for email: {}", email);
        
        // Periodic cleanup can be added here if needed, but for simple usage 
        // removing on validation/expiry check is enough.
        
        return code;
    }

    /**
     * Retrieves the OTP from memory and compares it with the user input.
     * If valid, it immediately deletes the OTP from memory to burn it.
     */
    public boolean validateOtp(String email, String inputOtp) {
        OtpData data = otpStorage.get(email);
        
        if (data == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(data.expiry)) {
            otpStorage.remove(email);
            return false;
        }

        if (data.code.equals(inputOtp)) {
            otpStorage.remove(email); // Burn it after successful validation
            return true;
        }

        return false;
    }
}
