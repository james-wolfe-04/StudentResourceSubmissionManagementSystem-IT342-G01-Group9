package com.sia.srms.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // actor (often teacher)
    private Long classId; // related class
    private String type; // RESOURCE_CREATE, RESOURCE_DELETE, ASSIGNMENT_CREATE, CLASS_UPDATE
    @Column(length = 1000)
    private String message;
    private Instant createdAt = Instant.now();

    public ActivityLog() {
    }

    public ActivityLog(Long userId, Long classId, String type, String message) {
        this.userId = userId;
        this.classId = classId;
        this.type = type;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
