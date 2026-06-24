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


    public MeetingQualityScoreDto calculateQualityScore(Long meetingId, Long userId) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);
        Transcript transcript = transcriptRepository.findByMeeting(meeting).orElse(null);
        List<Task> tasks = taskRepository.findByMeetingOrderByCreatedAtAsc(meeting);

        int score = 0;
        java.util.List<String> strengths = new java.util.ArrayList<>();
        java.util.List<String> warnings = new java.util.ArrayList<>();
        java.util.List<String> recommendations = new java.util.ArrayList<>();

        int taskCount = tasks != null ? tasks.size() : 0;
        long assignedCount = tasks == null ? 0 : tasks.stream()
            .filter(task -> hasText(task.getAssignee()))
            .count();
        long deadlineCount = tasks == null ? 0 : tasks.stream()
            .filter(task -> task.getDeadline() != null)
            .count();

        boolean hasSummary = hasText(meeting.getAiSummary()) || hasText(transcript != null ? transcript.getSummary() : null);
        boolean hasTasks = taskCount > 0;
        boolean allAssigned = hasTasks && assignedCount == taskCount;
        boolean allDeadlines = hasTasks && deadlineCount == taskCount;
        boolean hasDecisions = hasText(transcript != null ? transcript.getDecisions() : null);
        boolean hasNextSteps = hasText(transcript != null ? transcript.getNextSteps() : null);
        boolean hasQuestions = hasText(transcript != null ? transcript.getQuestions() : null);

        if (hasSummary) {
            score += 20;
            strengths.add("Eine KI-Zusammenfassung ist vorhanden.");
        } else {
            warnings.add("Es gibt noch keine verwertbare Zusammenfassung.");
            recommendations.add("Meeting-Protokoll analysieren, damit eine Zusammenfassung entsteht.");
        }

        if (hasTasks) {
            score += 20;
            strengths.add(taskCount + " Aufgabe(n) wurden aus dem Meeting erkannt.");

            score += (int) Math.round((assignedCount * 15.0) / taskCount);
            score += (int) Math.round((deadlineCount * 15.0) / taskCount);

            if (allAssigned) {
                strengths.add("Alle Aufgaben haben einen Verantwortlichen.");
            } else {
                warnings.add((taskCount - assignedCount) + " Aufgabe(n) haben noch keinen Verantwortlichen.");
                recommendations.add("Offene Verantwortlichkeiten direkt in der Aufgabenansicht zuweisen.");
            }

            if (allDeadlines) {
                strengths.add("Alle Aufgaben haben eine Deadline.");
            } else {
                warnings.add((taskCount - deadlineCount) + " Aufgabe(n) haben noch keine Deadline.");
                recommendations.add("Fehlende Deadlines ergänzen, damit das Deadline-Radar zuverlässig funktioniert.");
            }
        } else {
            warnings.add("Es wurden keine Aufgaben erkannt.");
            recommendations.add("Prüfen, ob aus dem Meeting konkrete To-dos abgeleitet werden sollten.");
        }

        if (hasDecisions) {
            score += 15;
            strengths.add("Entscheidungen wurden dokumentiert.");
        } else {
            warnings.add("Es wurden keine Entscheidungen erkannt.");
            recommendations.add("Wichtige Entscheidungen im Protokoll klarer formulieren.");
        }

        if (hasNextSteps) {
            score += 10;
            strengths.add("Nächste Schritte sind dokumentiert.");
        } else {
            warnings.add("Nächste Schritte fehlen oder sind unklar.");
            recommendations.add("Am Ende jedes Meetings klare nächste Schritte festhalten.");
        }

        if (hasQuestions) {
            score += 5;
            warnings.add("Es gibt offene Fragen, die nachverfolgt werden sollten.");
            recommendations.add("Offene Fragen in konkrete Aufgaben oder Klärungspunkte überführen.");
        } else {
            score += 5;
            strengths.add("Es wurden keine offenen Fragen erkannt.");
        }

        score = Math.max(0, Math.min(100, score));

        java.util.List<MeetingQualityCheckDto> checks = java.util.List.of(
            new MeetingQualityCheckDto("Zusammenfassung vorhanden", hasSummary,
                hasSummary ? "Das Meeting hat eine verwertbare Zusammenfassung." : "Es fehlt eine klare Zusammenfassung."),
            new MeetingQualityCheckDto("Aufgaben erkannt", hasTasks,
                hasTasks ? taskCount + " Aufgabe(n) erkannt." : "Es wurden keine konkreten Aufgaben erkannt."),
            new MeetingQualityCheckDto("Verantwortliche zugeordnet", allAssigned,
                allAssigned ? "Alle Aufgaben sind Personen zugeordnet." : "Es fehlen noch Verantwortliche."),
            new MeetingQualityCheckDto("Deadlines gesetzt", allDeadlines,
                allDeadlines ? "Alle Aufgaben haben Deadlines." : "Es fehlen noch Deadlines."),
            new MeetingQualityCheckDto("Entscheidungen dokumentiert", hasDecisions,
                hasDecisions ? "Entscheidungen wurden festgehalten." : "Es fehlen dokumentierte Entscheidungen."),
            new MeetingQualityCheckDto("Nächste Schritte klar", hasNextSteps,
                hasNextSteps ? "Nächste Schritte sind vorhanden." : "Nächste Schritte sind unklar."),
            new MeetingQualityCheckDto("Offene Fragen geklärt", !hasQuestions,
                hasQuestions ? "Es gibt offene Fragen." : "Keine offenen Fragen erkannt.")
        );

        String nextBestAction = nextBestAction(
            hasSummary,
            hasTasks,
            allAssigned,
            allDeadlines,
            hasDecisions,
            hasNextSteps,
            hasQuestions
        );

        return new MeetingQualityScoreDto(
            score,
            qualityLabel(score),
            qualitySummary(score),
            checks,
            strengths,
            warnings,
            recommendations,
            nextBestAction
        );
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


    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String qualityLabel(int score) {
        if (score >= 85) return "Sehr produktiv";
        if (score >= 70) return "Gut strukturiert";
        if (score >= 50) return "Verbesserbar";
        return "Kritisch";
    }

    private String qualitySummary(int score) {
        if (score >= 85) {
            return "Dieses Meeting ist sehr gut dokumentiert und gut nachbereitbar.";
        }

        if (score >= 70) {
            return "Dieses Meeting ist grundsätzlich gut strukturiert, hat aber noch einzelne Lücken.";
        }

        if (score >= 50) {
            return "Dieses Meeting enthält verwertbare Informationen, benötigt aber klarere Verantwortlichkeiten, Deadlines oder Entscheidungen.";
        }

        return "Dieses Meeting ist schwer nachzubereiten. Es fehlen wichtige Informationen für Aufgaben, Entscheidungen oder nächste Schritte.";
    }


    private String nextBestAction(boolean hasSummary,
                                  boolean hasTasks,
                                  boolean allAssigned,
                                  boolean allDeadlines,
                                  boolean hasDecisions,
                                  boolean hasNextSteps,
                                  boolean hasQuestions) {
        if (!hasSummary) return "Starte oder wiederhole die KI-Analyse, damit eine klare Zusammenfassung entsteht.";
        if (!hasTasks) return "Leite konkrete Aufgaben aus dem Meeting ab.";
        if (!allAssigned) return "Weise offene Aufgaben einer verantwortlichen Person zu.";
        if (!allDeadlines) return "Ergänze Deadlines für offene Aufgaben.";
        if (!hasDecisions) return "Dokumentiere die wichtigsten Entscheidungen aus dem Meeting.";
        if (!hasNextSteps) return "Formuliere klare nächste Schritte.";
        if (hasQuestions) return "Klär offene Fragen oder überführe sie in Aufgaben.";

        return "Das Meeting ist gut nachbereitbar. Prüfe nur noch, ob alle Beteiligten informiert wurden.";
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
