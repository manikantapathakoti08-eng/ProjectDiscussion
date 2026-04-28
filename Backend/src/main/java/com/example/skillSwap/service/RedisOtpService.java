package com.example.skillSwap.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisOtpService {

    private final StringRedisTemplate redisTemplate;
    
    // Prefix for keys in Redis
    private static final String OTP_PREFIX = "otp:";

    /**
     * Generates a random 6-digit OTP, stores it in Redis with a 10-minute TTL,
     * and returns the generated code.
     */
    public String generateAndStoreOtp(String email) {
        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        String key = OTP_PREFIX + email;
        
        // Save to Redis specifying the exact Time-To-Live
        redisTemplate.opsForValue().set(key, code, Duration.ofMinutes(10));
        log.info("Stored OTP in Redis for email: {}", email);
        
        return code;
    }

    /**
     * Retrieves the OTP from Redis and compares it with the user input.
     * If valid, it immediately deletes the OTP from Redis to burn it.
     */
    public boolean validateOtp(String email, String userInputOtp) {
        String key = OTP_PREFIX + email;
        String storedOtp = redisTemplate.opsForValue().get(key);
        
        if (storedOtp != null && storedOtp.equals(userInputOtp)) {
            // BURN IT! Prevent replay attacks by deleting upon successful validation
            redisTemplate.delete(key);
            log.info("OTP Successfully validated and deleted for email: {}", email);
            return true;
        }
        
        return false;
    }
}
