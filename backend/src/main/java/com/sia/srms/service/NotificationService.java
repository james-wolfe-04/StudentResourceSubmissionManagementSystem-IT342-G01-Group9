package com.sia.srms.service;

import com.sia.srms.model.Notification;
import com.sia.srms.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    public Notification create(Long userId, String type, String message, Long classId, Long entityId) {
        Notification n = new Notification(userId, type, message, classId, entityId);
        return repo.save(n);
    }

    public List<Notification> listForUser(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markRead(Long id) {
        repo.findById(id).ifPresent(n -> {
            n.setReadFlag(true);
            repo.save(n);
        });
    }

    public void clearForUser(Long userId) {
        List<Notification> list = repo.findByUserIdOrderByCreatedAtDesc(userId);
        repo.deleteAll(list);
    }
}
