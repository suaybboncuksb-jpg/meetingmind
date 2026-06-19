package com.meetingmind.auth.dto;

import com.meetingmind.user.User;

/** Öffentliche User-Daten (ohne Passwort) für die API-Antwort. */
public record UserDto(Long id, String email, String firstName, String lastName, String role) {

    public static UserDto from(User user) {
        return new UserDto(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole()
        );
    }
}
