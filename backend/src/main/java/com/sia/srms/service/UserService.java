package com.sia.srms.service;

import com.sia.srms.model.User;
import com.sia.srms.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Create or save a user
    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Update user's password
    public User updatePassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setPassword(newPassword);
            return userRepository.save(user);
        }
        return null;
    }
}
