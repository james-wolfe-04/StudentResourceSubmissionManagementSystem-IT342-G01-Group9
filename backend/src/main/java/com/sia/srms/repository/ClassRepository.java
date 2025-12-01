package com.sia.srms.repository;

import com.sia.srms.model.ClassEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    ClassEntity findByClassCode(String classCode);

    List<ClassEntity> findByTeacherId(Long teacherId);
}
