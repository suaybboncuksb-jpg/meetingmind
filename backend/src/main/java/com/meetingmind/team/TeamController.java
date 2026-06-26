package com.meetingmind.team;

import com.meetingmind.auth.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/team")
@CrossOrigin(origins = "http://localhost:5173")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping
    public ResponseEntity<TeamOverviewDto> getTeam(Authentication authentication) {
        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(teamService.getTeamOverview(userId));
    }

    @PostMapping("/invitations")
    public ResponseEntity<TeamInvitationDto> invite(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(teamService.invite(userId, request));
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nicht authentifiziert.");
        }

        return user.id();
    }
}
