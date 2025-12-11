package com.sia.srms.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(indexes = {
        @Index(name = "idx_notification_user_created", columnList = "userId,createdAt"),
        @Index(name = "idx_notification_user", columnList = "userId")
})
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // recipient
    private String type; // JOIN_REQUEST, JOIN_RESULT, RESOURCE, ASSIGNMENT
    private String message;
    private Long relatedClassId;
    private Long relatedEntityId; // assignmentId, resourceId, joinRequestId
    private boolean readFlag = false;
    private Instant createdAt = Instant.now();

    public Notification() {
    }

    public Notification(Long userId, String type, String message, Long relatedClassId, Long relatedEntityId) {
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.relatedClassId = relatedClassId;
        this.relatedEntityId = relatedEntityId;
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

    public Long getRelatedClassId() {
        return relatedClassId;
    }

    public void setRelatedClassId(Long relatedClassId) {
        this.relatedClassId = relatedClassId;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public boolean isReadFlag() {
        return readFlag;
    }

    public void setReadFlag(boolean readFlag) {
        this.readFlag = readFlag;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
