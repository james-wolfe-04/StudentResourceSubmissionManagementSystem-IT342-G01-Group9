package com.sia.srms.repository;

import com.sia.srms.model.ClassEntity;
import com.sia.srms.model.JoinRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    List<JoinRequest> findByClassEntityIdAndStatus(Long classId, String status);

    JoinRequest findByClassEntityIdAndStudentId(Long classId, Long studentId);

    List<JoinRequest> findByClassEntity(ClassEntity classEntity);
}