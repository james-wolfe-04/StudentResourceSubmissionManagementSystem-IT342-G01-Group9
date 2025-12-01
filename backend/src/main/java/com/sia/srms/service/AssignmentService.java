package com.sia.srms.service;

import com.sia.srms.model.Assignment;
import com.sia.srms.repository.AssignmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    public AssignmentService(AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    public Assignment createAssignment(Assignment assignment) {
        return assignmentRepository.save(assignment);
    }

    public List<Assignment> getAssignmentsByClass(Long classId) {
        return assignmentRepository.findByClassEntityId(classId);
    }

    public Assignment getAssignment(Long id) {
        return assignmentRepository.findById(id).orElse(null);
    }
}
