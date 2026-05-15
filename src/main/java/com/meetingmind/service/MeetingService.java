package com.meetingmind.service;

import com.meetingmind.model.Meeting;
import com.meetingmind.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;

    public List<Meeting> getAllMeetings() {
        return meetingRepository.findAllByOrderByMeetingDateDesc();
    }

    public Meeting getMeetingById(Long id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting nicht gefunden: " + id));
    }

    public Meeting createMeeting(Meeting meeting) {
        return meetingRepository.save(meeting);
    }

    public Meeting updateMeeting(Long id, Meeting updated) {
        Meeting existing = getMeetingById(id);
        existing.setTitle(updated.getTitle());
        existing.setLocation(updated.getLocation());
        existing.setMeetingDate(updated.getMeetingDate());
        existing.setProtocolText(updated.getProtocolText());
        return meetingRepository.save(existing);
    }

    public void deleteMeeting(Long id) {
        meetingRepository.deleteById(id);
    }
}