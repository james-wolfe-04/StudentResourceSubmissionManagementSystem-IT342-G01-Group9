package com.sia.srms.controller;

import com.sia.srms.model.User;
import com.sia.srms.service.GoogleAuthService;
import com.sia.srms.service.UserService;
import com.sia.srms.dto.SetPasswordRequest;
import com.sia.srms.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final UserService userService;
    private final GoogleAuthService googleAuthService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(UserService userService,
            GoogleAuthService googleAuthService,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.googleAuthService = googleAuthService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // ----------------------------
    // NORMAL EMAIL/PASSWORD LOGIN
    // ----------------------------
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody User loginData) {
        User user = userService.getByEmail(loginData.getEmail());
        if (user == null)
            throw new RuntimeException("User not found");
        if (!passwordEncoder.matches(loginData.getPassword(), user.getPassword()))
            throw new RuntimeException("Wrong password");
        String token = jwtUtil.generateToken(user);
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("token", token);
        return response;
    }

    // ----------------------------
    // GOOGLE LOGIN / AUTO-REGISTER
    // ----------------------------
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleLogin(@RequestBody Map<String, Object> payload) {
        // Robust parsing + logging to ensure asTeacher flag is read correctly on first
        // call
        String idToken = payload.get("idToken") instanceof String ? (String) payload.get("idToken") : null;
        Object asTeacherObj = payload.get("asTeacher");
        boolean asTeacher = false;
        if (asTeacherObj instanceof Boolean) {
            asTeacher = (Boolean) asTeacherObj;
        } else if (asTeacherObj instanceof String) {
            asTeacher = Boolean.parseBoolean((String) asTeacherObj);
        }
        System.out.println("googleLogin called. idToken present? " + (idToken != null) + ", asTeacher=" + asTeacher);
        if (idToken == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Missing idToken");
            return ResponseEntity.badRequest().body(error);
        }
        GoogleAuthService.GoogleUser googleUser = googleAuthService.verifyToken(idToken);
        if (googleUser == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Invalid Google token (audience mismatch or token expired)");
            return ResponseEntity.badRequest().body(error);
        }
        User existing = userService.getByEmail(googleUser.getEmail());
        boolean mustSetPassword = false;
        if (existing == null) {
            User newUser = new User();
            newUser.setEmail(googleUser.getEmail());
            newUser.setFullName(googleUser.getName());
            // Set a placeholder password (e.g., using the Google ID for a high-entropy
            // placeholder)
            newUser.setPassword(passwordEncoder.encode("GOOGLE_LOGIN"));
            newUser.setRole(asTeacher ? "TEACHER" : "STUDENT");
            System.out
                    .println("Creating new user with role: " + newUser.getRole() + " for email: " + newUser.getEmail());
            existing = userService.createUser(newUser);
            mustSetPassword = true; // first-time Google login
        } else {
            // Enforce single-role-per-email
            String existingRole = existing.getRole() == null ? "STUDENT" : existing.getRole().toUpperCase();
            String requestedRole = asTeacher ? "TEACHER" : "STUDENT";
            System.out.println("Existing user role=" + existingRole + ", requestedRole=" + requestedRole);
            if (!existingRole.equals(requestedRole)) {
                Map<String, Object> error = new HashMap<>();
                error.put("message", "Email already registered as " + existingRole);
                return ResponseEntity.badRequest().body(error);
            }
        }
        String token = jwtUtil.generateToken(existing);
        Map<String, Object> response = new HashMap<>();
        response.put("user", existing);
        response.put("token", token);
        response.put("mustSetPassword", mustSetPassword);
        return ResponseEntity.ok(response);
    }

    // ----------------------------
    // PASSWORD CREATION/UPDATE (FIX FOR 403 ERROR)
    // ----------------------------
    @PostMapping("/set-password")
    public ResponseEntity<Map<String, Object>> setPassword(@RequestBody SetPasswordRequest request) {
        // 1. Find the user by email
        User user = userService.getByEmail(request.getEmail());
        if (user == null) {
            // Since the client is sending the request, the user should exist.
            return ResponseEntity.notFound().build();
        }
        // 2. Encrypt and update the password
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(encodedPassword);

        // 3. Save the user (which clears the 'mustSetPassword' state implicitly,
        // or you can add a dedicated flag field to the User entity and clear it here).
        User updatedUser = userService.save(user);
        // 4. Generate a new JWT token for the now fully set-up user
        String token = jwtUtil.generateToken(updatedUser);
        // 5. Return the new token and user info
        Map<String, Object> response = new HashMap<>();
        response.put("user", updatedUser);
        response.put("token", token);
        // Include mustSetPassword: false to signal the client that the process is
        // complete
        response.put("mustSetPassword", false);
        return ResponseEntity.ok(response);
    }
}