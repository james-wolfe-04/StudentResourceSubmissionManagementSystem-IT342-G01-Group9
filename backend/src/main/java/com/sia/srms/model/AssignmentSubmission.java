package com.sia.srms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonGetter;

@Entity
@Table(name = "assignment_submissions")
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Assignment assignment;

    @ManyToOne(optional = false)
    private User student;

    @Column(columnDefinition = "TEXT")
    private String content; // optional submission text

    private String fileUrl; // optional file URL

    private Integer score; // 1 = on time, 0 = late

    private LocalDateTime submittedAt;

    private Double grade;

    // -------------------------
    // Getters & Setters
    // -------------------------
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Assignment getAssignment() {
        return assignment;
    }

    public void setAssignment(Assignment assignment) {
        this.assignment = assignment;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Double getGrade() {
        return grade;
    }

    public void setGrade(Double grade) {
        this.grade = grade;
    }

    // -------------------------
    // JSON Helpers
    // -------------------------
    @JsonGetter("grade")
    public Object getGradeForJson() {
        return (grade == null) ? "Not yet graded" : grade;
    }

    @JsonGetter("submissionSummary")
    public String getSubmissionSummary() {
        if ((content == null || content.isBlank()) && (fileUrl == null || fileUrl.isBlank())) {
            return "No content or file submitted";
        } else if (fileUrl != null && !fileUrl.isBlank() && (content == null || content.isBlank())) {
            return "File submitted only";
        } else if ((fileUrl == null || fileUrl.isBlank()) && content != null && !content.isBlank()) {
            return "Text submitted only";
        } else {
            return "Text and file submitted";
        }
    }
}
