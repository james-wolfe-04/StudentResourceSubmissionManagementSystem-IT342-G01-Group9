package com.sia.srms.repository;

import com.sia.srms.model.ResourceItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<ResourceItem, Long> {
    List<ResourceItem> findByClassId(Long classId);

    Page<ResourceItem> findByClassId(Long classId, Pageable pageable);
}
