package com.meetingmind.auth.dto;

import com.meetingmind.user.User;

/** Öffentliche User-Daten (ohne Passwort) für die API-Antwort. */
public record UserDto(
    Long id,
    String email,
    String firstName,
    String lastName,
    String role,
    String workspaceName
) {

    public static UserDto from(User user) {
        String workspaceName = user.getWorkspaceName();

        if (workspaceName == null || workspaceName.isBlank()) {
            workspaceName = "Mein Workspace";
        }

        return new UserDto(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            workspaceName
        );
    }
}
