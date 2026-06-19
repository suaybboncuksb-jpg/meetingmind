package com.meetingmind.auth.dto;

/** Antwort für Login/Register: JWT-Token + öffentliche User-Daten. */
public record AuthResponse(String token, UserDto user) {
}
