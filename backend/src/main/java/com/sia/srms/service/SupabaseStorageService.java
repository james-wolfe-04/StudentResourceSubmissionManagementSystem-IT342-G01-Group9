package com.sia.srms.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupabaseStorageService {

    // Stub method to upload a file, returns a fake URL for now
    public String uploadAssignmentFile(Long studentId, Long assignmentId, MultipartFile file) {
        // You will replace this with actual Supabase upload logic
        // For now, just return a placeholder URL
        return "https://supabase.storage.fake/" + studentId + "/" + assignmentId + "/" + file.getOriginalFilename();
    }
}
