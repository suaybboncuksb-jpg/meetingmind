package com.meetingmind.auth.dto;

/** Request-Body für POST /api/auth/login. */
public record LoginRequest(String email, String password) {
}
