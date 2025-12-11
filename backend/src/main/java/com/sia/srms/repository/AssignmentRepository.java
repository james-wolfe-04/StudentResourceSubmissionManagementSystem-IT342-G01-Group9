package com.sia.srms.repository;

import com.sia.srms.model.Assignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByClassEntityId(Long classId);

    Page<Assignment> findByClassEntityId(Long classId, Pageable pageable);
}
