package com.meetingmind.dto;

import com.meetingmind.model.UserRole;

public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private UserRole role;
    private boolean enabled;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long userId, String name, String email, UserRole role, boolean enabled) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.enabled = enabled;
    }

    public String getToken() {
        return token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public UserRole getRole() {
        return role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}