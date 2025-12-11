package com.sia.srms.controller;

import com.sia.srms.service.ClassService;
import com.sia.srms.service.ActivityLogService;
import com.sia.srms.service.JoinRequestService;
import com.sia.srms.dto.ClassDto;
import com.sia.srms.model.User;
import com.sia.srms.service.NotificationService;
import com.sia.srms.model.ClassEntity;
import com.sia.srms.model.JoinRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin("*")
public class ClassController {

    private final ClassService classService;
    private final JoinRequestService joinRequestService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    public ClassController(ClassService classService, JoinRequestService joinRequestService,
            NotificationService notificationService, ActivityLogService activityLogService) {
        this.classService = classService;
        this.joinRequestService = joinRequestService;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
    }

    // Teacher creates class
    @PostMapping
    public ClassEntity createClass(@RequestBody ClassDto dto) {
        return classService.createClass(dto);
    }

    // Student requests to join (old way)
    @PostMapping("/join")
    public JoinRequest requestToJoin(@RequestParam String classCode, @RequestParam Long studentId) {
        JoinRequest req = joinRequestService.createJoinRequest(classCode, studentId);
        // Notify teacher about new join request
        ClassEntity cls = classService.findByClassCode(classCode);
        if (cls != null && cls.getTeacher() != null) {
            Long teacherId = cls.getTeacher().getId();
            notificationService.create(teacherId, "JOIN_REQUEST",
                    "New join request from student ID " + studentId,
                    cls.getId(), req.getId());
        }
        return req;
    }

    // Student requests to join by classId (new way)
    public static class JoinRequestDto {
        public Long studentId;
    }

    // Teacher lists all join requests for a class
    @GetMapping("/{classId}/join-requests/all")
    public List<JoinRequest> getAllJoinRequests(@PathVariable Long classId) {
        ClassEntity classEntity = classService.findById(classId);
        if (classEntity == null) {
            throw new RuntimeException("Class not found");
        }
        return joinRequestService.getAllRequestsByClass(classEntity);
    }

    @PostMapping("/{classId}/join-request")
    public JoinRequest requestToJoinById(
            @PathVariable Long classId,
            @RequestBody JoinRequestDto requestBody) {

        ClassEntity classEntity = classService.findById(classId);
        if (classEntity == null) {
            throw new RuntimeException("Class not found");
        }

        JoinRequest req = joinRequestService.createJoinRequest(
                classEntity.getClassCode(),
                requestBody.studentId);
        if (classEntity.getTeacher() != null) {
            notificationService.create(classEntity.getTeacher().getId(), "JOIN_REQUEST",
                    "New join request from student ID " + requestBody.studentId,
                    classEntity.getId(), req != null ? req.getId() : null);
        }
        return req;
    }

    // Teacher approves/rejects
    @PostMapping("/{requestId}/approve")
    public JoinRequest approveRequest(@PathVariable Long requestId) {
        JoinRequest req = joinRequestService.approveRequest(requestId);
        // Notify student on approval
        if (req != null && req.getStudent() != null && req.getClassEntity() != null) {
            notificationService.create(req.getStudent().getId(), "JOIN_RESULT",
                    "Your request to join '" + req.getClassEntity().getName() + "' was approved.",
                    req.getClassEntity().getId(), req.getId());
        }
        return req;
    }

    @PostMapping("/{requestId}/reject")
    public JoinRequest rejectRequest(@PathVariable Long requestId) {
        JoinRequest req = joinRequestService.rejectRequest(requestId);
        // Notify student on rejection
        if (req != null && req.getStudent() != null && req.getClassEntity() != null) {
            notificationService.create(req.getStudent().getId(), "JOIN_RESULT",
                    "Your request to join '" + req.getClassEntity().getName() + "' was rejected.",
                    req.getClassEntity().getId(), req.getId());
        }
        return req;
    }

    // List classes for student/teacher
    @GetMapping("/teacher/{teacherId}")
    public List<ClassEntity> getTeacherClasses(@PathVariable Long teacherId) {
        return classService.getClassesByTeacher(teacherId);
    }

    @GetMapping("/student/{studentId}")
    public List<ClassEntity> getStudentClasses(@PathVariable Long studentId) {
        return classService.getClassesByStudent(studentId);
    }

    // Minimal endpoints to support frontend integrations
    @DeleteMapping("/{classId}/leave")
    public void leaveClass(@PathVariable Long classId, @RequestParam Long studentId) {
        ClassEntity cls = classService.findById(classId);
        if (cls == null)
            return;
        User student = classService.findUserById(studentId);
        if (student == null)
            return;
        classService.removeStudentFromClass(cls, studentId);
    }

    @GetMapping("/{classId}/students")
    public List<User> getStudents(@PathVariable Long classId) {
        ClassEntity cls = classService.findById(classId);
        if (cls == null)
            return java.util.Collections.emptyList();
        return cls.getStudents();
    }

    // Delete class (teacher-owned)
    @DeleteMapping("/{classId}")
    public void deleteClass(@PathVariable Long classId) {
        // Capture teacher id before deletion for activity log context
        Long teacherId = null;
        try {
            ClassEntity cls = classService.findById(classId);
            if (cls != null && cls.getTeacher() != null) {
                teacherId = cls.getTeacher().getId();
            }
        } catch (Exception ignored) {
        }

        classService.deleteClass(classId);
        try {
            activityLogService.log(teacherId, classId, "class:delete", "Class " + classId + " deleted");
        } catch (Exception ignored) {
        }
    }

    // Teacher lists pending join requests for a class
    @GetMapping("/{classId}/join-requests")
    public List<JoinRequest> getPendingJoinRequests(@PathVariable Long classId) {
        ClassEntity classEntity = classService.findById(classId);
        if (classEntity == null) {
            throw new RuntimeException("Class not found");
        }
        return joinRequestService.getPendingRequestsByClass(classEntity);
    }

}
