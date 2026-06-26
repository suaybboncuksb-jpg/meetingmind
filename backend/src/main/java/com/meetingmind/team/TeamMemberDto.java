package com.meetingmind.team;

import com.meetingmind.user.User;

public record TeamMemberDto(
    Long id,
    String email,
    String firstName,
    String lastName,
    String role,
    String workspaceName,
    String status
) {
    public static TeamMemberDto from(User user, String workspaceName) {
        return new TeamMemberDto(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            workspaceName,
            "ACTIVE"
        );
    }
}
