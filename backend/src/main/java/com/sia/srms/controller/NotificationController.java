package com.sia.srms.controller;

import com.sia.srms.model.Notification;
import com.sia.srms.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping("/user/{userId}")
    public List<Notification> list(@PathVariable Long userId) {
        return service.listForUser(userId);
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable Long id) {
        service.markRead(id);
    }

    @DeleteMapping("/user/{userId}")
    public void clear(@PathVariable Long userId) {
        service.clearForUser(userId);
    }
}
