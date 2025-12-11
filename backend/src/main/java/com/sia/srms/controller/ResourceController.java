package com.sia.srms.controller;

import com.sia.srms.model.ResourceItem;
import com.sia.srms.model.User;
import com.sia.srms.repository.ResourceRepository;
import com.sia.srms.service.ActivityLogService;
import com.sia.srms.service.ClassService;
import com.sia.srms.service.NotificationService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {
    private final ResourceRepository repo;
    private final NotificationService notificationService;
    private final ClassService classService;
    private final ActivityLogService activityLogService;

    public ResourceController(ResourceRepository repo, NotificationService notificationService,
            ClassService classService, ActivityLogService activityLogService) {
        this.repo = repo;
        this.notificationService = notificationService;
        this.classService = classService;
        this.activityLogService = activityLogService;
    }

    @GetMapping("/class/{classId}")
    public List<ResourceItem> getResources(@PathVariable Long classId) {
        return repo.findByClassId(classId);
    }

    @GetMapping("/class/{classId}/paged")
    public Page<ResourceItem> getResourcesPaged(@PathVariable Long classId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable p = PageRequest.of(page, Math.max(1, Math.min(size, 100)));
        return repo.findByClassId(classId, p);
    }

    @PostMapping("/class/{classId}/link")
    public ResponseEntity<ResourceItem> addLink(@PathVariable Long classId, @RequestBody ResourceItem body) {
        ResourceItem item = new ResourceItem();
        item.setClassId(classId);
        item.setTitle(body.getTitle());
        item.setUrl(body.getUrl());
        item.setDescription(body.getDescription());
        ResourceItem saved = repo.save(item);
        // Notify students about new resource
        List<User> students = classService.findById(classId).getStudents();
        students.forEach(s -> notificationService.create(s.getId(), "RESOURCE",
                "New resource: " + saved.getTitle(), classId, saved.getId()));
        var cls = classService.findById(classId);
        var teacherId = cls != null && cls.getTeacher() != null ? cls.getTeacher().getId() : null;
        activityLogService.log(teacherId, classId, "RESOURCE_CREATE", "Added resource '" + saved.getTitle() + "'");
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/class/{classId}/upload")
    public ResponseEntity<ResourceItem> upload(@PathVariable Long classId,
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "description", required = false) String description) {
        // Store file to local uploads folder and provide a download URL
        try {
            Path base = Paths.get("uploads", "class-" + classId);
            Files.createDirectories(base);
            String original = file.getOriginalFilename();
            if (original == null)
                original = "upload";
            Path dest = base.resolve(original);
            Files.write(dest, file.getBytes());

            ResourceItem item = new ResourceItem();
            item.setClassId(classId);
            item.setTitle(title);
            item.setFileName(original);
            item.setDescription(description);
            // Save first to get ID
            ResourceItem saved = repo.save(item);
            // Provide direct URL under static /uploads mapping
            saved.setUrl("/uploads/class-" + classId + "/" + original);
            repo.save(saved);

            List<User> students = classService.findById(classId).getStudents();
            students.forEach(s -> notificationService.create(s.getId(), "RESOURCE",
                    "New resource: " + saved.getTitle(), classId, saved.getId()));
            var cls = classService.findById(classId);
            var teacherId = cls != null && cls.getTeacher() != null ? cls.getTeacher().getId() : null;
            activityLogService.log(teacherId, classId, "RESOURCE_CREATE",
                    "Uploaded resource '" + saved.getTitle() + "'");
            return ResponseEntity.ok(saved);
        } catch (IOException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Removed /api/resources/{id}/download endpoint as requested

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.findById(id).ifPresent(item -> {
            Long classId = item.getClassId();
            String title = item.getTitle();
            repo.deleteById(id);
            var cls = classService.findById(classId);
            var teacherId = cls != null && cls.getTeacher() != null ? cls.getTeacher().getId() : null;
            activityLogService.log(teacherId, classId, "RESOURCE_DELETE", "Deleted resource '" + title + "'");
        });
        return ResponseEntity.noContent().build();
    }
}
