package com.sia.srms.service;

import com.sia.srms.dto.ClassDto;
import com.sia.srms.model.ClassEntity;
import com.sia.srms.model.User;
import com.sia.srms.repository.ClassRepository;
import com.sia.srms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
public class ClassService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    public ClassService(ClassRepository classRepository, UserRepository userRepository) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
    }

    // Create a class (Teacher only)
    public ClassEntity createClass(ClassDto dto) {

        ClassEntity classEntity = new ClassEntity();
        classEntity.setName(dto.name);
        classEntity.setSubject(dto.subject);
        classEntity.setSection(dto.section);
        classEntity.setDescription(dto.description);

        // Generate unique class code
        classEntity.setClassCode(generateClassCode());

        // Attach teacher
        User teacher = userRepository.findById(dto.teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        classEntity.setTeacher(teacher);

        return classRepository.save(classEntity);
    }

    // Get classes by teacher
    public List<ClassEntity> getClassesByTeacher(Long teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }

    // Find class by ID
    public ClassEntity findById(Long id) {
        return classRepository.findById(id).orElse(null);
    }

    // Find class by its unique code
    public ClassEntity findByClassCode(String classCode) {
        return classRepository.findByClassCode(classCode);
    }

    // Get classes by student
    public List<ClassEntity> getClassesByStudent(Long studentId) {
        return classRepository.findAll().stream()
                .filter(c -> c.getStudents().stream().anyMatch(s -> s.getId().equals(studentId)))
                .toList();
    }

    public User findUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // Add student to class
    public ClassEntity addStudentToClass(ClassEntity classEntity, User student) {
        if (student != null) {
            classEntity.getStudents().add(student);
        }
        return classRepository.save(classEntity);
    }

    // Remove student from class
    public ClassEntity removeStudentFromClass(ClassEntity classEntity, Long studentId) {
        if (classEntity == null || studentId == null)
            return classEntity;
        classEntity.getStudents().removeIf(s -> s.getId().equals(studentId));
        return classRepository.save(classEntity);
    }

    // Delete class (Teacher only): remove associations and delete entity
    public void deleteClass(Long classId) {
        ClassEntity cls = findById(classId);
        if (cls == null)
            return;
        // Clear students association to avoid constraint issues
        if (cls.getStudents() != null) {
            cls.getStudents().clear();
            classRepository.save(cls);
        }
        classRepository.deleteById(classId);
    }

    // Utility: generate 6-character unique class code
    private String generateClassCode() {
        String code;
        do {
            byte[] bytes = new byte[4];
            random.nextBytes(bytes);
            code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).substring(0, 6);
        } while (classRepository.findByClassCode(code) != null);
        return code.toUpperCase();
    }
}
