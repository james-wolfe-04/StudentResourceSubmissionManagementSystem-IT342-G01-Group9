package com.sia.srms.controller;

import com.sia.srms.model.ActivityLog;
import com.sia.srms.service.ActivityLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin("*")
public class ActivityController {
    private final ActivityLogService service;

    public ActivityController(ActivityLogService service) {
        this.service = service;
    }

    @GetMapping("/class/{classId}")
    public Page<ActivityLog> classLogs(@PathVariable Long classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable p = PageRequest.of(page, Math.max(1, Math.min(size, 100)));
        return service.getByClass(classId, p);
    }

    @GetMapping("/user/{userId}")
    public Page<ActivityLog> userLogs(@PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable p = PageRequest.of(page, Math.max(1, Math.min(size, 100)));
        return service.getByUser(userId, p);
    }
}
