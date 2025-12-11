package com.sia.srms.service;

import com.sia.srms.model.Assignment;
import com.sia.srms.model.AssignmentSubmission;
import com.sia.srms.model.User;
import com.sia.srms.repository.AssignmentSubmissionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AssignmentSubmissionService {

    private final AssignmentSubmissionRepository submissionRepository;

    public AssignmentSubmissionService(AssignmentSubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    // Unified submitAssignment method
    public AssignmentSubmission submitAssignment(Assignment assignment, User student, String content, String fileUrl) {

        AssignmentSubmission existing = submissionRepository.findByAssignmentIdAndStudentId(
                assignment.getId(), student.getId());
        if (existing != null) {
            throw new RuntimeException("You have already submitted this assignment");
        }

        // Block late submissions strictly
        if (assignment.getDeadline() != null && LocalDateTime.now().isAfter(assignment.getDeadline())) {
            throw new RuntimeException("Deadline has passed. Late submissions are not allowed.");
        }

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setContent(content);
        submission.setFileUrl(fileUrl);
        submission.setSubmittedAt(LocalDateTime.now());

        submission.setScore(1); // on-time

        return submissionRepository.save(submission);
    }

    public AssignmentSubmission saveSubmission(AssignmentSubmission submission) {
        return submissionRepository.save(submission);
    }

    public AssignmentSubmission getSubmission(Long id) {
        return submissionRepository.findById(id).orElse(null);
    }

    public AssignmentSubmission getSubmissionByAssignmentAndStudent(Long assignmentId, Long studentId) {
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
    }

    public java.util.List<AssignmentSubmission> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    public AssignmentSubmission gradeSubmission(Long submissionId, Double grade) {
        AssignmentSubmission sub = getSubmission(submissionId);
        if (sub == null) {
            throw new RuntimeException("Submission not found");
        }
        sub.setGrade(grade);
        return submissionRepository.save(sub);
    }

    public AssignmentSubmission feedbackAndGrade(Long submissionId, String feedback, Double grade) {
        AssignmentSubmission sub = getSubmission(submissionId);
        if (sub == null) {
            throw new RuntimeException("Submission not found");
        }
        sub.setGrade(grade);
        if (feedback != null && !feedback.isBlank()) {
            sub.setFeedback(feedback);
        }
        return submissionRepository.save(sub);
    }

}
