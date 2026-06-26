package com.meetingmind.team;

public record TeamInvitationDto(
    Long id,
    String email,
    String role,
    String status,
    String workspaceName,
    String invitedBy,
    String createdAt
) {
    public static TeamInvitationDto from(TeamInvitation invitation) {
        String inviterName = invitation.getInvitedBy().getFirstName() + " " + invitation.getInvitedBy().getLastName();

        return new TeamInvitationDto(
            invitation.getId(),
            invitation.getEmail(),
            invitation.getRole(),
            invitation.getStatus(),
            invitation.getWorkspaceName(),
            inviterName.trim(),
            invitation.getCreatedAt() != null ? invitation.getCreatedAt().toString() : null
        );
    }
}
