package com.sia.srms.service;

import com.sia.srms.model.Assignment;
import com.sia.srms.repository.AssignmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

    public Page<Assignment> getAssignmentsByClassPaged(Long classId, int page, int size) {
        return assignmentRepository.findByClassEntityId(classId,
                PageRequest.of(page, Math.max(1, Math.min(size, 100))));
    }

    public Assignment getAssignment(Long id) {
        return assignmentRepository.findById(id).orElse(null);
    }

    public Assignment updateAssignment(Long id, java.util.function.Consumer<Assignment> updater) {
        Assignment existing = getAssignment(id);
        if (existing == null)
            return null;
        updater.accept(existing);
        return assignmentRepository.save(existing);
    }

    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }
}
