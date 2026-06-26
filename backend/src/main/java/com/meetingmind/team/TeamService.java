package com.meetingmind.team;

import com.meetingmind.user.User;
import com.meetingmind.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class TeamService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamInvitationRepository teamInvitationRepository;

    public TeamOverviewDto getTeamOverview(Long userId) {
        User currentUser = getUser(userId);
        String workspaceName = workspaceNameOf(currentUser);

        List<TeamMemberDto> members = userRepository
            .findByWorkspaceNameIgnoreCaseOrderByCreatedAtAsc(workspaceName)
            .stream()
            .map(user -> TeamMemberDto.from(user, workspaceName))
            .toList();

        if (members.isEmpty()) {
            members = List.of(TeamMemberDto.from(currentUser, workspaceName));
        }

        List<TeamInvitationDto> invitations = teamInvitationRepository
            .findByWorkspaceNameIgnoreCaseOrderByCreatedAtDesc(workspaceName)
            .stream()
            .map(TeamInvitationDto::from)
            .toList();

        return new TeamOverviewDto(workspaceName, members, invitations);
    }

    public TeamInvitationDto invite(Long userId, Map<String, String> request) {
        User currentUser = getUser(userId);
        String workspaceName = workspaceNameOf(currentUser);

        String email = clean(request.get("email")).toLowerCase();
        String role = normalizeRole(request.get("role"));

        if (email.isBlank() || !email.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bitte eine gültige E-Mail-Adresse angeben.");
        }

        if (teamInvitationRepository.existsByWorkspaceNameIgnoreCaseAndEmailIgnoreCaseAndStatus(workspaceName, email, "PENDING")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Für diese E-Mail existiert bereits eine offene Einladung.");
        }

        TeamInvitation invitation = new TeamInvitation();
        invitation.setWorkspaceName(workspaceName);
        invitation.setEmail(email);
        invitation.setRole(role);
        invitation.setStatus("PENDING");
        invitation.setInvitedBy(currentUser);
        invitation.setUpdatedAt(LocalDateTime.now());

        return TeamInvitationDto.from(teamInvitationRepository.save(invitation));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String workspaceNameOf(User user) {
        String workspaceName = clean(user.getWorkspaceName());

        if (!workspaceName.isBlank()) {
            return workspaceName;
        }

        return "Mein Workspace";
    }

    private String normalizeRole(String value) {
        String role = clean(value).toUpperCase();

        if (role.equals("ADMIN") || role.equals("MANAGER") || role.equals("MEMBER")) {
            return role;
        }

        return "MEMBER";
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
