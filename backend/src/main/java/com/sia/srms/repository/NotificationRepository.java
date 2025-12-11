package com.sia.srms.repository;

import com.sia.srms.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
