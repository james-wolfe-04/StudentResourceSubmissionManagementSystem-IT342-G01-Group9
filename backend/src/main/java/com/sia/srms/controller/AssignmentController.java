package com.sia.srms.controller;

import com.sia.srms.model.Assignment;
import com.sia.srms.model.AssignmentSubmission;
import com.sia.srms.model.User;
import com.sia.srms.repository.UserRepository;
import com.sia.srms.service.AssignmentService;
import com.sia.srms.service.AssignmentSubmissionService;
import com.sia.srms.service.SupabaseStorageService;
import com.sia.srms.security.JwtUtil;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin("*")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentSubmissionService submissionService;
    private final UserRepository userRepository;
    private final SupabaseStorageService supabaseStorageService;

    public AssignmentController(
            AssignmentService assignmentService,
            AssignmentSubmissionService submissionService,
            UserRepository userRepository,
            SupabaseStorageService supabaseStorageService) {
        this.assignmentService = assignmentService;
        this.submissionService = submissionService;
        this.userRepository = userRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    // -------------------------
    // CREATE ASSIGNMENT (Teacher)
    // -------------------------
    @PostMapping("/create")
    public Assignment createAssignment(@RequestBody Assignment assignment) {
        return assignmentService.createAssignment(assignment);
    }

    // -------------------------
    // SUBMIT ASSIGNMENT (Text Only)
    // -------------------------
    @PostMapping(value = "/{assignmentId}/submit", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AssignmentSubmission submitAssignment(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User currentUser, // Inject logged-in user from JWT
            @RequestBody(required = false) String content) {

        Assignment assignment = assignmentService.getAssignment(assignmentId);
        if (assignment == null)
            throw new RuntimeException("Assignment not found");

        return submissionService.submitAssignment(assignment, currentUser, content, null);
    }

    // -------------------------
    // SUBMIT ASSIGNMENT (File + Optional Text)
    // -------------------------
    @PostMapping(value = "/{assignmentId}/submit-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AssignmentSubmission submitAssignmentFile(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User currentUser, // Inject logged-in user from JWT
            @RequestPart(required = false, name = "content") String content,
            @RequestPart(required = false, name = "file") MultipartFile file) {

        Assignment assignment = assignmentService.getAssignment(assignmentId);
        if (assignment == null)
            throw new RuntimeException("Assignment not found");

        String fileUrl = null;
        if (file != null && !file.isEmpty()) {
            fileUrl = supabaseStorageService.uploadAssignmentFile(currentUser.getId(), assignmentId, file);
        }

        return submissionService.submitAssignment(assignment, currentUser, content, fileUrl);
    }

    // -------------------------
    // GRADE SUBMISSION (Teacher)
    // -------------------------
    @PutMapping("/submissions/{submissionId}/grade")
    public AssignmentSubmission gradeSubmission(
            @PathVariable Long submissionId,
            @RequestParam Double grade) {

        AssignmentSubmission submission = submissionService.getSubmission(submissionId);
        if (submission == null)
            throw new RuntimeException("Submission not found");

        submission.setGrade(grade);
        return submissionService.saveSubmission(submission);
    }

    // -------------------------
    // GET ASSIGNMENTS BY CLASS
    // -------------------------
    @GetMapping("/class/{classId}")
    public List<Assignment> getAssignments(@PathVariable Long classId) {
        return assignmentService.getAssignmentsByClass(classId);
    }

    // -------------------------
    // GET SINGLE ASSIGNMENT
    // -------------------------
    @GetMapping("/{id}")
    public Assignment getAssignment(@PathVariable Long id) {
        return assignmentService.getAssignment(id);
    }

    @GetMapping("/{assignmentId}/submissions")
    public AssignmentSubmission getStudentSubmission(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User currentUser) {

        AssignmentSubmission submission = submissionService.getSubmissionByAssignmentAndStudent(assignmentId,
                currentUser.getId());

        return submission == null ? null : submission;
    }

}
