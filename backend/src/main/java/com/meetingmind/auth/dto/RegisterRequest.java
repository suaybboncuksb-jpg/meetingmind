package com.meetingmind.auth.dto;

/** Request-Body für POST /api/auth/register (Frontend sendet name, email, password). */
public record RegisterRequest(String name, String email, String password) {
}
