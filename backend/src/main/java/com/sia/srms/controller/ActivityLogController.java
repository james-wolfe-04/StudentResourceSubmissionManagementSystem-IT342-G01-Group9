package com.sia.srms.controller;

import com.sia.srms.service.ActivityLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity-logs")
@CrossOrigin("*")
public class ActivityLogController {
    private final ActivityLogService service;

    public ActivityLogController(ActivityLogService service) {
        this.service = service;
    }

    @GetMapping("/class/{classId}")
    public Page<com.sia.srms.model.ActivityLog> getByClass(@PathVariable Long classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getByClass(classId, PageRequest.of(Math.max(page, 0), Math.max(size, 1)));
    }

    @GetMapping("/user/{userId}")
    public Page<com.sia.srms.model.ActivityLog> getByUser(@PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getByUser(userId, PageRequest.of(Math.max(page, 0), Math.max(size, 1)));
    }
}
