package com.example.skillSwap.repository;

import com.example.skillSwap.model.Availability;
import com.example.skillSwap.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    // Find slots that are NOT yet taken
    List<Availability> findByGuideAndIsBookedFalse(User guide);
}