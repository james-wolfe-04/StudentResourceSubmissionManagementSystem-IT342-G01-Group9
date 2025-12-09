package com.sia.srms.controller;

import com.sia.srms.model.ResourceItem;
import com.sia.srms.model.User;
import com.sia.srms.repository.ResourceRepository;
import com.sia.srms.service.ClassService;
import com.sia.srms.service.NotificationService;
import org.springframework.core.io.FileSystemResource;
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

    public ResourceController(ResourceRepository repo, NotificationService notificationService,
            ClassService classService) {
        this.repo = repo;
        this.notificationService = notificationService;
        this.classService = classService;
    }

    @GetMapping("/class/{classId}")
    public List<ResourceItem> getResources(@PathVariable Long classId) {
        return repo.findByClassId(classId);
    }

    @PostMapping("/class/{classId}/link")
    public ResponseEntity<ResourceItem> addLink(@PathVariable Long classId, @RequestBody ResourceItem body) {
        ResourceItem item = new ResourceItem();
        item.setClassId(classId);
        item.setTitle(body.getTitle());
        item.setUrl(body.getUrl());
        ResourceItem saved = repo.save(item);
        // Notify students about new resource
        List<User> students = classService.findById(classId).getStudents();
        students.forEach(s -> notificationService.create(s.getId(), "RESOURCE",
                "New resource: " + saved.getTitle(), classId, saved.getId()));
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/class/{classId}/upload")
    public ResponseEntity<ResourceItem> upload(@PathVariable Long classId,
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file) {
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
            // Save first to get ID
            ResourceItem saved = repo.save(item);
            // Set URL to download endpoint and resave
            saved.setUrl("/api/resources/" + saved.getId() + "/download");
            saved = repo.save(saved);

            List<User> students = classService.findById(classId).getStudents();
            students.forEach(s -> notificationService.create(s.getId(), "RESOURCE",
                    "New resource: " + saved.getTitle(), classId, saved.getId()));
            return ResponseEntity.ok(saved);
        } catch (IOException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<FileSystemResource> download(@PathVariable Long id) {
        ResourceItem item = repo.findById(id).orElse(null);
        if (item == null || item.getFileName() == null)
            return ResponseEntity.notFound().build();
        Path path = Paths.get("uploads", "class-" + item.getClassId(), item.getFileName());
        if (!Files.exists(path))
            return ResponseEntity.notFound().build();
        String filename = item.getFileName().toLowerCase(Locale.ROOT);
        MediaType type = MediaType.APPLICATION_OCTET_STREAM;
        if (filename.endsWith(".png"))
            type = MediaType.IMAGE_PNG;
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
            type = MediaType.IMAGE_JPEG;
        else if (filename.endsWith(".gif"))
            type = MediaType.IMAGE_GIF;
        else if (filename.endsWith(".pdf"))
            type = MediaType.APPLICATION_PDF;
        FileSystemResource resource = new FileSystemResource(path.toFile());
        return ResponseEntity.ok()
                .contentType(type)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }
}
