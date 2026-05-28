package com.meetingmind.controller;

import com.meetingmind.dto.MeetingRequest;
import com.meetingmind.model.Meeting;
import com.meetingmind.model.Participant;
import com.meetingmind.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MeetingController {

    private final MeetingService meetingService;

    @GetMapping
    public List<Meeting> getAllMeetings() {
        return meetingService.getAllMeetings();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Meeting> getMeetingById(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.getMeetingById(id));
    }

    @PostMapping
    public ResponseEntity<Meeting> createMeeting(@RequestBody MeetingRequest request) {
        Meeting meeting = new Meeting();
        meeting.setTitle(request.getTitle());
        meeting.setLocation(request.getLocation());
        meeting.setMeetingDate(request.getMeetingDate());
        meeting.setProtocolText(request.getProtocolText());

        Meeting saved = meetingService.createMeeting(meeting);

        if (request.getParticipants() != null) {
            List<Participant> participants = new ArrayList<>();
            for (String name : request.getParticipants()) {
                Participant p = new Participant();
                p.setName(name);
                p.setMeeting(saved);
                participants.add(p);
            }
            saved.setParticipants(participants);
            saved = meetingService.saveMeeting(saved);
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Meeting> updateMeeting(@PathVariable Long id,
                                                  @RequestBody MeetingRequest request) {
        Meeting meeting = meetingService.getMeetingById(id);
        meeting.setTitle(request.getTitle());
        meeting.setLocation(request.getLocation());
        meeting.setMeetingDate(request.getMeetingDate());
        meeting.setProtocolText(request.getProtocolText());

        if (request.getParticipants() != null) {
            List<Participant> participants = new ArrayList<>();
            for (String name : request.getParticipants()) {
                Participant p = new Participant();
                p.setName(name);
                p.setMeeting(meeting);
                participants.add(p);
            }
            meeting.setParticipants(participants);
        }

        return ResponseEntity.ok(meetingService.saveMeeting(meeting));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeeting(@PathVariable Long id) {
        meetingService.deleteMeeting(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<Meeting> analyzeMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.analyzeMeeting(id));
    }
}
