package com.sia.srms.controller;

import com.sia.srms.model.User;
import com.sia.srms.service.GoogleAuthService;
import com.sia.srms.service.UserService;
import com.sia.srms.dto.GoogleAuthRequest;
import com.sia.srms.dto.SetPasswordRequest;
import com.sia.srms.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
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
    public Map<String, Object> googleLogin(@RequestBody GoogleAuthRequest request) {

        GoogleAuthService.GoogleUser googleUser = googleAuthService.verifyToken(request.getIdToken());
        if (googleUser == null)
            throw new RuntimeException("Invalid Google token");

        User existing = userService.getByEmail(googleUser.getEmail());
        boolean mustSetPassword = false;

        if (existing == null) {
            User newUser = new User();
            newUser.setEmail(googleUser.getEmail());
            newUser.setFullName(googleUser.getName());
            newUser.setPassword(passwordEncoder.encode("GOOGLE_LOGIN")); // placeholder
            newUser.setRole("STUDENT");
            existing = userService.createUser(newUser);
            mustSetPassword = true; // first-time Google login
        }

        String token = jwtUtil.generateToken(existing);

        Map<String, Object> response = new HashMap<>();
        response.put("user", existing);
        response.put("token", token);
        response.put("mustSetPassword", mustSetPassword); // send flag
        return response;
    }

    // ----------------------------
    // SET PASSWORD AFTER GOOGLE LOGIN
    // ----------------------------
    @PostMapping("/set-password")
    public Map<String, Object> setPassword(@RequestBody SetPasswordRequest request) {
        User updated = userService.updatePassword(request.getEmail(),
                passwordEncoder.encode(request.getPassword()));

        if (updated == null)
            throw new RuntimeException("User not found");

        String token = jwtUtil.generateToken(updated);

        Map<String, Object> response = new HashMap<>();
        response.put("user", updated);
        response.put("token", token);
        return response;
    }
}
