package com.meetingmind.meeting;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.meetingmind.user.User;
import com.meetingmind.user.UserRepository;
import com.meetingmind.transcript.Transcript;
import com.meetingmind.transcript.TranscriptRepository;
import com.meetingmind.ai.MistralService;
import com.meetingmind.ai.MistralAnalysisResult;
import com.meetingmind.task.TaskService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MeetingService {

    @Autowired
    private MeetingRepository meetingRepository;

    @Autowired
    private TranscriptRepository transcriptRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MistralService mistralService;

    @Autowired
    private TaskService taskService;

    public Meeting createMeeting(String title, String description, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Meeting meeting = new Meeting();
        meeting.setTitle(title);
        meeting.setDescription(description);
        meeting.setCreatedBy(user);
        meeting.setMeetingDate(LocalDateTime.now());
        meeting.setStatus("DRAFT");

        return meetingRepository.save(meeting);
    }

    public Meeting analyzeMeeting(Long meetingId, Long userId, String transcript) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);

        meeting.setStatus("ANALYZING");
        meeting.setTranscript(transcript);
        meetingRepository.save(meeting);

        System.out.println("Starting Mistral analysis for meeting: " + meetingId);
        MistralAnalysisResult analysisResult = mistralService.analyzeTranscript(transcript);

        // Idempotent: vorhandenes Transkript wiederverwenden (Unique pro Meeting)
        Transcript transcriptEntity = transcriptRepository.findByMeeting(meeting)
            .orElseGet(Transcript::new);
        transcriptEntity.setMeeting(meeting);
        transcriptEntity.setOriginalText(transcript);
        transcriptEntity.setSummary(analysisResult.getSummary());
        transcriptEntity.setKeyPoints(analysisResult.getKeyPoints());
        transcriptEntity.setDecisions(analysisResult.getDecisions());
        transcriptEntity.setActionItems(analysisResult.getActionItems());
        transcriptEntity.setNextSteps(analysisResult.getNextSteps());
        transcriptEntity.setQuestions(analysisResult.getQuestions());
        transcriptEntity.setMistralRawResponse(analysisResult.getRawResponse());
        transcriptEntity.setAnalysisStatus("COMPLETED");

        transcriptRepository.save(transcriptEntity);

        // Aus den erkannten Action Items echte Aufgaben (inkl. Deadline) erzeugen
        taskService.createFromActionItems(meeting, analysisResult.getActionItemList());

        meeting.setStatus("ANALYZED");
        meeting.setAiSummary(analysisResult.getSummary());
        meeting.setUpdatedAt(LocalDateTime.now());

        return meetingRepository.save(meeting);
    }

    public List<Meeting> getUserMeetings(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return meetingRepository.findByCreatedByOrderByMeetingDateDesc(user);
    }

    public Meeting getMeetingById(Long meetingId, Long userId) {
        return getOwnedMeeting(meetingId, userId);
    }

    private Meeting getOwnedMeeting(Long meetingId, Long userId) {
        return meetingRepository.findByIdAndCreatedBy_Id(meetingId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));
    }
}
