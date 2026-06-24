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
import com.meetingmind.task.Task;
import com.meetingmind.task.TaskRepository;

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

    @Autowired
    private TaskRepository taskRepository;

    public Meeting createMeeting(String title, String description, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Meeting meeting = new Meeting();
        meeting.setTitle(requireText(title, "Meeting-Titel darf nicht leer sein."));
        meeting.setDescription(emptyToNull(description));
        meeting.setCreatedBy(user);
        meeting.setMeetingDate(LocalDateTime.now());
        meeting.setStatus("DRAFT");

        return meetingRepository.save(meeting);
    }

    public Meeting analyzeMeeting(Long meetingId, Long userId, String transcript) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);
        String cleanTranscript = requireText(transcript, "Transkript darf nicht leer sein.");

        meeting.setStatus("ANALYZING");
        meeting.setTranscript(cleanTranscript);
        meetingRepository.save(meeting);

        System.out.println("Starting Mistral analysis for meeting: " + meetingId);
        MistralAnalysisResult analysisResult = mistralService.analyzeTranscript(cleanTranscript);

        Transcript transcriptEntity = transcriptRepository.findByMeeting(meeting)
            .orElseGet(Transcript::new);
        transcriptEntity.setMeeting(meeting);
        transcriptEntity.setOriginalText(cleanTranscript);
        transcriptEntity.setSummary(analysisResult.getSummary());
        transcriptEntity.setKeyPoints(analysisResult.getKeyPoints());
        transcriptEntity.setDecisions(analysisResult.getDecisions());
        transcriptEntity.setActionItems(analysisResult.getActionItems());
        transcriptEntity.setNextSteps(analysisResult.getNextSteps());
        transcriptEntity.setQuestions(analysisResult.getQuestions());
        transcriptEntity.setMistralRawResponse(analysisResult.getRawResponse());
        transcriptEntity.setAnalysisStatus("COMPLETED");

        transcriptRepository.save(transcriptEntity);

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


    public FollowUpDto generateFollowUp(Long meetingId, Long userId) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);
        Transcript transcript = transcriptRepository.findByMeeting(meeting).orElse(null);
        List<Task> tasks = taskRepository.findByMeetingOrderByCreatedAtAsc(meeting);

        String subject = "Follow-up zum Meeting: " + meeting.getTitle();

        StringBuilder body = new StringBuilder();

        body.append("Hallo zusammen,\n\n");
        body.append("hier ist das Follow-up zu unserem Meeting");
        if (meeting.getTitle() != null && !meeting.getTitle().isBlank()) {
            body.append(" „").append(meeting.getTitle()).append("“");
        }
        body.append(".\n\n");

        appendSection(body, "Zusammenfassung", firstNonBlank(
            transcript != null ? transcript.getSummary() : null,
            meeting.getAiSummary(),
            "Es liegt noch keine KI-Zusammenfassung vor."
        ));

        appendSection(body, "Entscheidungen", firstNonBlank(
            transcript != null ? transcript.getDecisions() : null,
            "Es wurden keine Entscheidungen erkannt."
        ));

        appendTasksSection(body, tasks);

        appendSection(body, "Offene Fragen", firstNonBlank(
            transcript != null ? transcript.getQuestions() : null,
            "Es wurden keine offenen Fragen erkannt."
        ));

        appendSection(body, "Nächste Schritte", firstNonBlank(
            transcript != null ? transcript.getNextSteps() : null,
            "Die nächsten Schritte ergeben sich aus den oben genannten Aufgaben."
        ));

        body.append("Viele Grüße");

        return new FollowUpDto(subject, body.toString());
    }

    private Meeting getOwnedMeeting(Long meetingId, Long userId) {
        return meetingRepository.findByIdAndCreatedBy_Id(meetingId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));
    }


    private void appendSection(StringBuilder body, String title, String content) {
        body.append(title).append(":\n");
        body.append(content).append("\n\n");
    }

    private void appendTasksSection(StringBuilder body, List<Task> tasks) {
        body.append("Aufgaben:\n");

        if (tasks == null || tasks.isEmpty()) {
            body.append("- Es wurden keine Aufgaben erkannt.\n\n");
            return;
        }

        for (Task task : tasks) {
            body.append("- ").append(task.getTitle());

            if (task.getAssignee() != null && !task.getAssignee().isBlank()) {
                body.append(" – Zuständig: ").append(task.getAssignee());
            } else {
                body.append(" – Zuständig: noch offen");
            }

            if (task.getDeadline() != null) {
                body.append(" – Deadline: ").append(task.getDeadline());
            } else {
                body.append(" – Deadline: noch offen");
            }

            body.append("\n");
        }

        body.append("\n");
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }

        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        return "";
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
