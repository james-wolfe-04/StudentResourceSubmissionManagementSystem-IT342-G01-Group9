package com.sia.srms.service;

import com.sia.srms.model.ActivityLog;
import com.sia.srms.repository.ActivityLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ActivityLogService {
    private final ActivityLogRepository repo;

    public ActivityLogService(ActivityLogRepository repo) {
        this.repo = repo;
    }

    public ActivityLog log(Long userId, Long classId, String type, String message) {
        return repo.save(new ActivityLog(userId, classId, type, message));
    }

    public Page<ActivityLog> getByClass(Long classId, Pageable pageable) {
        return repo.findByClassIdOrderByCreatedAtDesc(classId, pageable);
    }

    public Page<ActivityLog> getByUser(Long userId, Pageable pageable) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}
