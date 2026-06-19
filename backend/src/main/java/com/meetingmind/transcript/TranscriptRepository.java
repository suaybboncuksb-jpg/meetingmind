package com.meetingmind.transcript;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.meetingmind.meeting.Meeting;
import java.util.Optional;

@Repository
public interface TranscriptRepository extends JpaRepository<Transcript, Long> {
    Optional<Transcript> findByMeeting(Meeting meeting);
}
