package com.meetingmind.meeting;

import com.meetingmind.auth.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/meetings")
@CrossOrigin(origins = "http://localhost:5173")
public class MeetingController {

    @Autowired
    private MeetingService meetingService;

    @PostMapping
    public ResponseEntity<MeetingDto> createMeeting(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String projectName = (String) request.get("projectName");
        Long userId = currentUserId(authentication);

        Meeting meeting = meetingService.createMeeting(title, description, projectName, userId);
        return ResponseEntity.ok(MeetingDto.from(meeting));
    }


    @PostMapping("/{id}/analysis-preview")
    public ResponseEntity<AnalysisPreviewDto> previewAnalysis(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String transcript = request.get("transcript");
        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(meetingService.previewAnalysis(id, userId, transcript));
    }

    @PostMapping("/{id}/analysis-preview/apply")
    public ResponseEntity<MeetingDto> applyAnalysisPreview(
            @PathVariable Long id,
            @RequestBody AnalysisPreviewDto preview,
            Authentication authentication) {

        Long userId = currentUserId(authentication);

        Meeting meeting = meetingService.applyAnalysisPreview(id, userId, preview);
        return ResponseEntity.ok(MeetingDto.from(meeting));
    }


    @PostMapping("/{id}/analyze")
    public ResponseEntity<MeetingDto> analyzeMeeting(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String transcript = request.get("transcript");
        Long userId = currentUserId(authentication);

        Meeting meeting = meetingService.analyzeMeeting(id, userId, transcript);
        return ResponseEntity.ok(MeetingDto.from(meeting));
    }

    @GetMapping
    public ResponseEntity<List<MeetingDto>> getUserMeetings(Authentication authentication) {
        Long userId = currentUserId(authentication);

        List<MeetingDto> meetings = meetingService.getUserMeetings(userId)
            .stream().map(MeetingDto::from).toList();

        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingDto> getMeeting(@PathVariable Long id, Authentication authentication) {
        Long userId = currentUserId(authentication);

        Meeting meeting = meetingService.getMeetingById(id, userId);
        return ResponseEntity.ok(MeetingDto.from(meeting));
    }


    @GetMapping("/{id}/follow-up")
    public ResponseEntity<FollowUpDto> getFollowUp(@PathVariable Long id, Authentication authentication) {
        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(meetingService.generateFollowUp(id, userId));
    }


    @GetMapping("/{id}/quality-score")
    public ResponseEntity<MeetingQualityScoreDto> getQualityScore(@PathVariable Long id, Authentication authentication) {
        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(meetingService.calculateQualityScore(id, userId));
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nicht authentifiziert.");
        }

        return user.id();
    }
}
