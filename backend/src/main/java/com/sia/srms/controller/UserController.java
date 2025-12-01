package com.sia.srms.controller;

import com.sia.srms.model.User;
import com.sia.srms.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.createUser(user);
    }

    @GetMapping("/{email}")
    public User getUser(@PathVariable String email) {
        return userService.getByEmail(email);
    }
}
