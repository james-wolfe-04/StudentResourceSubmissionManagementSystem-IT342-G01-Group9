package com.sia.srms.repository;

import com.sia.srms.model.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {

    AssignmentSubmission findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
}
