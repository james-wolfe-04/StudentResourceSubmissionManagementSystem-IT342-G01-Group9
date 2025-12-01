package com.sia.srms.controller;

import com.sia.srms.service.ClassService;
import com.sia.srms.service.JoinRequestService;
import com.sia.srms.dto.ClassDto;
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

    public ClassController(ClassService classService, JoinRequestService joinRequestService) {
        this.classService = classService;
        this.joinRequestService = joinRequestService;
    }

    // Teacher creates class
    @PostMapping
    public ClassEntity createClass(@RequestBody ClassDto dto) {
        return classService.createClass(dto);
    }

    // Student requests to join (old way)
    @PostMapping("/join")
    public JoinRequest requestToJoin(@RequestParam String classCode, @RequestParam Long studentId) {
        return joinRequestService.createJoinRequest(classCode, studentId);
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

        return joinRequestService.createJoinRequest(
                classEntity.getClassCode(),
                requestBody.studentId);
    }

    // Teacher approves/rejects
    @PostMapping("/{requestId}/approve")
    public JoinRequest approveRequest(@PathVariable Long requestId) {
        return joinRequestService.approveRequest(requestId);
    }

    @PostMapping("/{requestId}/reject")
    public JoinRequest rejectRequest(@PathVariable Long requestId) {
        return joinRequestService.rejectRequest(requestId);
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
