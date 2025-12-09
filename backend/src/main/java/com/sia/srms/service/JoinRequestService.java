package com.sia.srms.service;

import com.sia.srms.model.ClassEntity;
import com.sia.srms.model.JoinRequest;
import com.sia.srms.model.User;
import com.sia.srms.repository.ClassRepository;
import com.sia.srms.repository.JoinRequestRepository;
import com.sia.srms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassService classService;

    public JoinRequestService(JoinRequestRepository joinRequestRepository,
            ClassRepository classRepository,
            UserRepository userRepository,
            ClassService classService) {
        this.joinRequestRepository = joinRequestRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.classService = classService;
    }

    // Create a join request
    public JoinRequest createJoinRequest(String classCode, Long studentId) {
        ClassEntity classEntity = classRepository.findByClassCode(classCode);
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

        if (classEntity == null)
            throw new RuntimeException("Class not found");

        // If already enrolled, return a synthetic approved response (id may be null)
        if (classEntity.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
            JoinRequest already = new JoinRequest();
            already.setClassEntity(classEntity);
            already.setStudent(student);
            already.setStatus("APPROVED");
            return already;
        }

        // Check if request exists
        JoinRequest existingRequest = joinRequestRepository.findByClassEntityIdAndStudentId(classEntity.getId(),
                studentId);
        if (existingRequest != null) {
            // Idempotent behaviour: return existing or reset REJECTED to PENDING
            String status = existingRequest.getStatus();
            if ("REJECTED".equals(status)) {
                existingRequest.setStatus("PENDING");
                return joinRequestRepository.save(existingRequest);
            }

            if ("APPROVED".equals(status)) {
                // Ensure enrollment is reflected
                if (classEntity.getStudents().stream().noneMatch(s -> s.getId().equals(studentId))) {
                    classService.addStudentToClass(classEntity, student);
                }
                return existingRequest;
            }

            // PENDING or any other status – just return as-is
            return existingRequest;
        }

        JoinRequest request = new JoinRequest();
        request.setClassEntity(classEntity);
        request.setStudent(student);
        request.setStatus("PENDING");

        return joinRequestRepository.save(request);
    }

    // Approve a join request
    public JoinRequest approveRequest(Long requestId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        request.setStatus("APPROVED");
        joinRequestRepository.save(request);

        // Add student to class
        classService.addStudentToClass(request.getClassEntity(), request.getStudent());
        return request;
    }

    // Reject a join request
    public JoinRequest rejectRequest(Long requestId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        request.setStatus("REJECTED");
        return joinRequestRepository.save(request);
    }

    // List pending requests for a class
    public List<JoinRequest> getPendingRequests(Long classId) {
        return joinRequestRepository.findByClassEntityIdAndStatus(classId, "PENDING");
    }

    public List<JoinRequest> getAllRequestsByClass(ClassEntity classEntity) {
        return joinRequestRepository.findByClassEntity(classEntity);
    }

    public List<JoinRequest> getPendingRequestsByClass(ClassEntity classEntity) {
        return joinRequestRepository.findByClassEntity(classEntity).stream()
                .filter(r -> "PENDING".equals(r.getStatus()))
                .toList();
    }
}
