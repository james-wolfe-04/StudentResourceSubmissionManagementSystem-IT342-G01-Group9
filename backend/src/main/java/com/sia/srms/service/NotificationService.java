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

    public List<Notification> listForUser(Long userId, int page, int size) {
        return repo
                .findByUserIdOrderByCreatedAtDesc(userId,
                        org.springframework.data.domain.PageRequest.of(Math.max(page, 0), Math.max(size, 1)))
                .getContent();
    }

    public void markRead(Long id) {
        repo.findById(id).ifPresent(n -> {
            n.setReadFlag(true);
            repo.save(n);
        });
    }

    public void markAllReadForUser(Long userId) {
        List<Notification> list = repo.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : list) {
            if (!n.isReadFlag()) {
                n.setReadFlag(true);
            }
        }
        if (!list.isEmpty()) {
            repo.saveAll(list);
        }
    }

    public void clearForUser(Long userId) {
        List<Notification> list = repo.findByUserIdOrderByCreatedAtDesc(userId);
        repo.deleteAll(list);
    }

    public Notification getById(Long id) {
        return repo.findById(id).orElse(null);
    }
}
