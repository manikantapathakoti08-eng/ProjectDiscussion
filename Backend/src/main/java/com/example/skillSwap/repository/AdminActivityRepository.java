package com.example.skillSwap.repository;

import com.example.skillSwap.model.AdminActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminActivityRepository extends JpaRepository<AdminActivityLog, Long> {
}