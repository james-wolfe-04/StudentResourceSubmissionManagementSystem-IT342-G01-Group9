package com.sia.srms.controller;

import com.sia.srms.model.Notification;
import com.sia.srms.service.NotificationService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public Notification getById(@PathVariable Long id, Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        Notification n = service.getById(id);
        if (n == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        // Ensure only the owner can read the notification
        Object principal = auth.getPrincipal();
        Long subjectId = null;
        if (principal instanceof com.sia.srms.model.User u) {
            subjectId = u.getId();
        }
        if (subjectId == null || !n.getUserId().equals(subjectId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return n;
    }

    @GetMapping("/user/{userId}")
    public List<Notification> list(@PathVariable Long userId,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            Authentication auth) {
        // Enforce RBAC: user can only access their own notifications
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        Object principal = auth.getPrincipal();
        Long subjectId = null;
        if (principal instanceof com.sia.srms.model.User u) {
            subjectId = u.getId();
        }
        if (subjectId == null || !userId.equals(subjectId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (page == null || size == null) {
            return service.listForUser(userId);
        }
        return service.listForUser(userId, page, size);
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable Long id, Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        service.markRead(id);
    }

    @PostMapping("/user/{userId}/read-all")
    public void markAllRead(@PathVariable Long userId, Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        Object principal = auth.getPrincipal();
        Long subjectId = null;
        if (principal instanceof com.sia.srms.model.User u) {
            subjectId = u.getId();
        }
        if (subjectId == null || !userId.equals(subjectId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        service.markAllReadForUser(userId);
    }

    @DeleteMapping("/user/{userId}")
    public void clear(@PathVariable Long userId) {
        service.clearForUser(userId);
    }
}
