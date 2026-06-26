package com.meetingmind.team;

import java.util.List;

public record TeamOverviewDto(
    String workspaceName,
    List<TeamMemberDto> members,
    List<TeamInvitationDto> invitations
) {
}
