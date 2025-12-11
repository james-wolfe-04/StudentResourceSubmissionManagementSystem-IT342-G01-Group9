package com.sia.srms.controller;

import com.sia.srms.model.Assignment;
import com.sia.srms.model.AssignmentSubmission;
import com.sia.srms.model.User;
import com.sia.srms.repository.UserRepository;
import com.sia.srms.service.ClassService;
import com.sia.srms.service.ActivityLogService;
import com.sia.srms.service.AssignmentService;
import com.sia.srms.service.AssignmentSubmissionService;
import com.sia.srms.service.NotificationService;
import com.sia.srms.service.SupabaseStorageService;
import com.sia.srms.security.JwtUtil;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin("*")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentSubmissionService submissionService;
    private final UserRepository userRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final NotificationService notificationService;
    private final ClassService classService;
    private final ActivityLogService activityLogService;

    public AssignmentController(
            AssignmentService assignmentService,
            AssignmentSubmissionService submissionService,
            UserRepository userRepository,
            SupabaseStorageService supabaseStorageService,
            NotificationService notificationService,
            ClassService classService,
            ActivityLogService activityLogService) {
        this.assignmentService = assignmentService;
        this.submissionService = submissionService;
        this.userRepository = userRepository;
        this.supabaseStorageService = supabaseStorageService;
        this.notificationService = notificationService;
        this.classService = classService;
        this.activityLogService = activityLogService;
    }

    // -------------------------
    // CREATE ASSIGNMENT (Teacher)
    // -------------------------
    public static class CreateAssignmentDto {
        public String title;
        public String description;
        // Accept deadline as string to allow multiple input formats (ISO, MM/dd/yyyy
        // hh:mm a)
        public String deadline;
        public Long classId;
    }

    // (moved create endpoint below with ResponseEntity)

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
            @AuthenticationPrincipal User currentUser,
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
    // GET CURRENT USER SUBMISSION (used by frontend Submissions.js)
    // -------------------------
    @GetMapping("/{assignmentId}/submissions")
    public ResponseEntity<?> getMySubmission(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        AssignmentSubmission sub = submissionService.getSubmissionByAssignmentAndStudent(assignmentId,
                currentUser.getId());
        if (sub == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(sub);
    }

    // -------------------------
    // TEACHER: LIST ALL SUBMISSIONS FOR ASSIGNMENT
    // -------------------------
    @GetMapping("/{assignmentId}/submissions/all")
    public List<AssignmentSubmission> getAllSubmissions(@PathVariable Long assignmentId) {
        return submissionService.getSubmissionsByAssignment(assignmentId);
    }

    // -------------------------
    // TEACHER: GRADE A SUBMISSION
    // -------------------------
    public static class GradeDto {
        public Double grade;
        public String feedback;
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody GradeDto body,
            @AuthenticationPrincipal User currentUser) {
        try {
            if (currentUser == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            if (body == null || body.grade == null) {
                return ResponseEntity.badRequest().body("Missing grade");
            }
            AssignmentSubmission updated = submissionService.feedbackAndGrade(submissionId, body.feedback, body.grade);
            try {
                var assignment = updated.getAssignment();
                var classId = assignment != null && assignment.getClassEntity() != null
                        ? assignment.getClassEntity().getId()
                        : null;
                activityLogService.log(currentUser.getId(), classId, "GRADE_ASSIGNMENT",
                        "Graded submission #" + updated.getId() + " with " + body.grade
                                + (body.feedback != null && !body.feedback.isBlank() ? "; feedback provided" : ""));
                notificationService.create(updated.getStudent().getId(), "GRADE",
                        "Your assignment was graded: " + body.grade
                                + (body.feedback != null && !body.feedback.isBlank() ? "; feedback: " + body.feedback
                                        : ""),
                        classId, assignment != null ? assignment.getId() : null);
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Failed to grade submission: " + ex.getMessage());
        }
    }

    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createAssignment(@RequestBody CreateAssignmentDto body) {
        try {
            if (body == null) {
                return ResponseEntity.badRequest().body("Request body is required");
            }
            if (body.classId == null) {
                return ResponseEntity.badRequest().body("classId is required");
            }

            var classEntity = classService.findById(body.classId);
            if (classEntity == null) {
                return ResponseEntity.badRequest().body("Class not found for classId=" + body.classId);
            }

            Assignment assignment = new Assignment();
            assignment.setTitle(body.title);
            assignment.setDescription(body.description);
            // Parse deadline from string; support common UI formats
            java.time.LocalDateTime parsedDeadline = null;
            if (body.deadline != null) {
                String dl = body.deadline.trim();
                // Remove any trailing placeholders like "--"
                if (dl.endsWith("--")) {
                    dl = dl.substring(0, dl.length() - 2).trim();
                }
                // Try ISO-8601 first (e.g., 2025-12-10T23:59)
                try {
                    parsedDeadline = java.time.LocalDateTime.parse(dl);
                } catch (Exception ignore) {
                    // Try with AM/PM pattern e.g. 12/10/2025 11:59 PM
                    try {
                        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter
                                .ofPattern("MM/dd/yyyy hh:mm a");
                        parsedDeadline = java.time.LocalDateTime.parse(dl, fmt);
                    } catch (Exception ignore2) {
                        // Try alternative 24-hour pattern e.g. 12/10/2025 23:59
                        try {
                            java.time.format.DateTimeFormatter fmt24 = java.time.format.DateTimeFormatter
                                    .ofPattern("MM/dd/yyyy HH:mm");
                            parsedDeadline = java.time.LocalDateTime.parse(dl, fmt24);
                        } catch (Exception ignore3) {
                            // If all parsing fails, leave deadline null (optional)
                            parsedDeadline = null;
                        }
                    }
                }
            }
            assignment.setDeadline(parsedDeadline);
            assignment.setClassEntity(classEntity);

            Assignment created = assignmentService.createAssignment(assignment);
            // Best-effort notifications and activity log; don't fail creation
            try {
                Long classId = created.getClassEntity().getId();
                List<User> students = classService.findById(classId).getStudents();
                for (User s : students) {
                    try {
                        notificationService.create(s.getId(), "ASSIGNMENT",
                                "New assignment: " + created.getTitle(),
                                classId, created.getId());
                    } catch (Exception ignored) {
                    }
                }
                try {
                    var cls = classService.findById(classId);
                    var teacherId = cls != null && cls.getTeacher() != null ? cls.getTeacher().getId() : null;
                    activityLogService.log(teacherId, classId, "ASSIGNMENT_CREATE",
                            "Created assignment '" + created.getTitle() + "'");
                } catch (Exception ignored) {
                }
            } catch (Exception ignoredOuter) {
            }
            return ResponseEntity.ok(created);
        } catch (Exception ex) {
            // Return a readable error so the frontend can show context
            return ResponseEntity.badRequest().body("Failed to create assignment: " + ex.getMessage());
        }
    }

    // -------------------------
    // GET ASSIGNMENTS BY CLASS
    // -------------------------
    @GetMapping("/class/{classId}")
    public List<Assignment> getAssignments(@PathVariable Long classId) {
        return assignmentService.getAssignmentsByClass(classId);
    }

    // Paged list of assignments per class
    @GetMapping("/class/{classId}/paged")
    public Page<Assignment> getAssignmentsPaged(
            @PathVariable Long classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return assignmentService.getAssignmentsByClassPaged(classId, page, size);
    }

    // -------------------------
    // UPDATE ASSIGNMENT (Teacher)
    // -------------------------
    public static class UpdateAssignmentDto {
        public String title;
        public String description;
        public String deadline;
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody UpdateAssignmentDto body) {
        try {
            Assignment updated = assignmentService.updateAssignment(id, a -> {
                if (body.title != null)
                    a.setTitle(body.title);
                if (body.description != null)
                    a.setDescription(body.description);
                if (body.deadline != null) {
                    try {
                        a.setDeadline(java.time.LocalDateTime.parse(body.deadline.trim()));
                    } catch (Exception e1) {
                        try {
                            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter
                                    .ofPattern("MM/dd/yyyy hh:mm a");
                            a.setDeadline(java.time.LocalDateTime.parse(body.deadline.trim(), fmt));
                        } catch (Exception e2) {
                            try {
                                java.time.format.DateTimeFormatter fmt24 = java.time.format.DateTimeFormatter
                                        .ofPattern("MM/dd/yyyy HH:mm");
                                a.setDeadline(java.time.LocalDateTime.parse(body.deadline.trim(), fmt24));
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            });
            if (updated == null)
                return ResponseEntity.status(404).body("Assignment not found");
            try {
                var classId = updated.getClassEntity() != null ? updated.getClassEntity().getId() : null;
                activityLogService.log(null, classId, "ASSIGNMENT_UPDATE",
                        "Updated assignment '" + updated.getTitle() + "'");
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Failed to update assignment: " + ex.getMessage());
        }
    }

    // Upload or replace attachment for assignment
    @PostMapping(value = "/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> setAssignmentAttachment(@PathVariable Long id,
            @RequestPart(name = "file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        try {
            Assignment assignment = assignmentService.getAssignment(id);
            if (assignment == null)
                return ResponseEntity.status(404).body("Assignment not found");
            if (file == null || file.isEmpty())
                return ResponseEntity.badRequest().body("File is required");
            String url = supabaseStorageService.uploadAssignmentFile(currentUser != null ? currentUser.getId() : 0L, id,
                    file);
            assignment.setAttachmentFileName(file.getOriginalFilename());
            assignment.setAttachmentUrl(url);
            Assignment saved = assignmentService.createAssignment(assignment);
            try {
                var classId = assignment.getClassEntity() != null ? assignment.getClassEntity().getId() : null;
                activityLogService.log(currentUser != null ? currentUser.getId() : null, classId,
                        "ASSIGNMENT_ATTACHMENT", "Updated attachment for '" + assignment.getTitle() + "'");
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Failed to set attachment: " + ex.getMessage());
        }
    }

    // -------------------------
    // DELETE ASSIGNMENT (Teacher)
    // -------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            Assignment assignment = assignmentService.getAssignment(id);
            if (assignment == null)
                return ResponseEntity.status(404).body("Assignment not found");
            Long classId = assignment.getClassEntity() != null ? assignment.getClassEntity().getId() : null;
            assignmentService.deleteAssignment(id);
            try {
                activityLogService.log(null, classId, "ASSIGNMENT_DELETE",
                        "Deleted assignment '" + assignment.getTitle() + "'");
            } catch (Exception ignored) {
            }
            return ResponseEntity.noContent().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Failed to delete assignment: " + ex.getMessage());
        }
    }

    // -------------------------
    // GET ASSIGNMENTS BY STUDENT (all classes)
    // -------------------------
    @GetMapping("/student/{studentId}")
    public List<java.util.Map<String, Object>> getAssignmentsForStudent(@PathVariable Long studentId) {
        var classes = classService.getClassesByStudent(studentId);
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (var cls : classes) {
            var list = assignmentService.getAssignmentsByClass(cls.getId());
            for (var a : list) {
                java.util.Map<String, Object> dto = new java.util.HashMap<>();
                dto.put("id", a.getId());
                dto.put("title", a.getTitle());
                dto.put("description", a.getDescription());
                dto.put("deadline", a.getDeadline());
                dto.put("classId", cls.getId());
                dto.put("className", cls.getName());
                dto.put("attachmentFileName", a.getAttachmentFileName());
                dto.put("attachmentUrl", a.getAttachmentUrl());
                result.add(dto);
            }
        }
        return result;
    }

}
