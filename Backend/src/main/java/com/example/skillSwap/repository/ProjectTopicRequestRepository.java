package com.example.skillSwap.repository;

import com.example.skillSwap.model.ProjectTopicRequest;
import com.example.skillSwap.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectTopicRequestRepository extends JpaRepository<ProjectTopicRequest, Long> {
    List<ProjectTopicRequest> findByStatus(RequestStatus status);
    List<ProjectTopicRequest> findByUserId(Long userId);
}
