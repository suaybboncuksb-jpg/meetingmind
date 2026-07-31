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
import com.meetingmind.ai.ActionItem;
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

    public Meeting createMeeting(String title, String description, String projectName, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Meeting meeting = new Meeting();
        meeting.setTitle(requireText(title, "Meeting-Titel darf nicht leer sein."));
        meeting.setDescription(emptyToNull(description));
        meeting.setProjectName(emptyToNull(projectName));
        meeting.setCreatedBy(user);
        meeting.setMeetingDate(LocalDateTime.now());
        meeting.setStatus("DRAFT");

        return meetingRepository.save(meeting);
    }

    public Meeting updateMeeting(Long meetingId, Long userId, String title, String description,
                                  String projectName, String participants) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);

        if (title != null) meeting.setTitle(requireText(title, "Meeting-Titel darf nicht leer sein."));
        if (description != null) meeting.setDescription(emptyToNull(description));
        if (projectName != null) meeting.setProjectName(emptyToNull(projectName));
        if (participants != null) meeting.setParticipants(emptyToNull(participants));

        meeting.setUpdatedAt(LocalDateTime.now());

        return meetingRepository.save(meeting);
    }

    public AnalysisPreviewDto previewAnalysis(Long meetingId, Long userId, String transcript) {
        getOwnedMeeting(meetingId, userId);
        String cleanTranscript = requireText(transcript, "Transkript darf nicht leer sein.");

        System.out.println("Starting Mistral preview for meeting: " + meetingId);
        MistralAnalysisResult analysisResult = mistralService.analyzeTranscript(cleanTranscript);

        if (!analysisResult.isSuccessful()) {
            String reason = analysisResult.getErrorMessage();
            String message = reason == null || reason.isBlank()
                ? "KI-Vorschau fehlgeschlagen."
                : "KI-Vorschau fehlgeschlagen: " + reason;

            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
        }

        return AnalysisPreviewDto.from(meetingId, cleanTranscript, analysisResult);
    }

    public Meeting applyAnalysisPreview(Long meetingId, Long userId, AnalysisPreviewDto preview) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);

        if (preview == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Analyse-Vorschau fehlt.");
        }

        String cleanTranscript = requireText(preview.transcript(), "Transkript darf nicht leer sein.");

        Transcript transcriptEntity = transcriptRepository.findByMeeting(meeting)
            .orElseGet(Transcript::new);

        transcriptEntity.setMeeting(meeting);
        transcriptEntity.setOriginalText(cleanTranscript);
        transcriptEntity.setSummary(emptyToNull(preview.summary()));
        transcriptEntity.setKeyPoints(joinList(preview.keyPoints()));
        transcriptEntity.setDecisions(joinList(preview.decisions()));
        transcriptEntity.setActionItems(joinPreviewTasks(preview.actionItems()));
        transcriptEntity.setDeadlines(joinPreviewDeadlines(preview.deadlines()));
        transcriptEntity.setNextSteps(joinList(preview.nextSteps()));
        transcriptEntity.setQuestions(joinList(preview.questions()));
        transcriptEntity.setMistralRawResponse(emptyToNull(preview.rawResponse()));
        transcriptEntity.setAnalysisStatus("COMPLETED");

        transcriptRepository.save(transcriptEntity);

        List<ActionItem> actionItems = preview.actionItems() == null
            ? List.of()
            : preview.actionItems().stream()
                .map(AnalysisPreviewTaskDto::toActionItem)
                .toList();

        taskService.createFromActionItems(meeting, actionItems);

        meeting.setTranscript(cleanTranscript);
        meeting.setStatus("ANALYZED");
        meeting.setAiSummary(emptyToNull(preview.summary()));
        meeting.setUpdatedAt(LocalDateTime.now());

        return meetingRepository.save(meeting);
    }

    public List<Meeting> getUserMeetings(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return meetingRepository.findByCreatedByOrderByMeetingDateDesc(user);
    }

    public MeetingAnalysisDto getAnalysisDetails(Long meetingId, Long userId) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);

        return transcriptRepository.findByMeeting(meeting)
            .map(transcript -> MeetingAnalysisDto.from(meeting.getId(), transcript))
            .orElseGet(() -> MeetingAnalysisDto.empty(meeting.getId()));
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
            .filter(task -> task.getAssignee() != null)
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
                recommendations.add("Fehlende Deadlines ergaenzen, damit das Deadline-Radar zuverlaessig funktioniert.");
            }
        } else {
            warnings.add("Es wurden keine Aufgaben erkannt.");
            recommendations.add("Pruefen, ob aus dem Meeting konkrete To-dos abgeleitet werden sollten.");
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
            strengths.add("Naechste Schritte sind dokumentiert.");
        } else {
            warnings.add("Naechste Schritte fehlen oder sind unklar.");
            recommendations.add("Am Ende jedes Meetings klare naechste Schritte festhalten.");
        }

        if (hasQuestions) {
            score += 5;
            warnings.add("Es gibt offene Fragen, die nachverfolgt werden sollten.");
            recommendations.add("Offene Fragen in konkrete Aufgaben oder Klaerungspunkte ueberfuehren.");
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
            new MeetingQualityCheckDto("Naechste Schritte klar", hasNextSteps,
                hasNextSteps ? "Naechste Schritte sind vorhanden." : "Naechste Schritte sind unklar."),
            new MeetingQualityCheckDto("Offene Fragen geklaert", !hasQuestions,
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
            body.append(" \u201e").append(meeting.getTitle()).append("\u201c");
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

        appendSection(body, "Fristen", firstNonBlank(
            transcript != null ? transcript.getDeadlines() : null,
            "Es wurden keine eigenstaendigen Fristen erkannt."
        ));

        appendSection(body, "Offene Fragen", firstNonBlank(
            transcript != null ? transcript.getQuestions() : null,
            "Es wurden keine offenen Fragen erkannt."
        ));

        appendSection(body, "Naechste Schritte", firstNonBlank(
            transcript != null ? transcript.getNextSteps() : null,
            "Die naechsten Schritte ergeben sich aus den oben genannten Aufgaben."
        ));

        body.append("Viele Gruesse");

        return new FollowUpDto(subject, body.toString());
    }

    public void deleteMeeting(Long meetingId, Long userId) {
        Meeting meeting = getOwnedMeeting(meetingId, userId);

        List<Task> tasks = taskRepository.findByMeetingOrderByCreatedAtAsc(meeting);
        if (tasks != null && !tasks.isEmpty()) {
            taskRepository.deleteAll(tasks);
        }

        transcriptRepository.findByMeeting(meeting)
            .ifPresent(transcriptRepository::delete);

        meetingRepository.delete(meeting);
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

            if (task.getAssignee() != null) {
                String name = (task.getAssignee().getFirstName() + " " + task.getAssignee().getLastName()).trim();
                body.append(" - Zustaendig: ").append(name);
            } else if (task.getAiSuggestedAssigneeName() != null && !task.getAiSuggestedAssigneeName().isBlank()) {
                body.append(" - Zustaendig: ").append(task.getAiSuggestedAssigneeName()).append(" (noch nicht zugeordnet)");
            } else {
                body.append(" - Zustaendig: noch offen");
            }

            if (task.getDeadline() != null) {
                body.append(" - Deadline: ").append(task.getDeadline());
                if (task.isDeadlineEstimated()) {
                    body.append(" (KI-Schaetzung)");
                }
            } else {
                body.append(" - Deadline: noch offen");
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
            return "Dieses Meeting ist grundsaetzlich gut strukturiert, hat aber noch einzelne Luecken.";
        }

        if (score >= 50) {
            return "Dieses Meeting enthaelt verwertbare Informationen, benoetigt aber klarere Verantwortlichkeiten, Deadlines oder Entscheidungen.";
        }

        return "Dieses Meeting ist schwer nachzubereiten. Es fehlen wichtige Informationen fuer Aufgaben, Entscheidungen oder naechste Schritte.";
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
        if (!allDeadlines) return "Ergaenze Deadlines fuer offene Aufgaben.";
        if (!hasDecisions) return "Dokumentiere die wichtigsten Entscheidungen aus dem Meeting.";
        if (!hasNextSteps) return "Formuliere klare naechste Schritte.";
        if (hasQuestions) return "Klaer offene Fragen oder ueberfuehre sie in Aufgaben.";

        return "Das Meeting ist gut nachbereitbar. Pruefe nur noch, ob alle Beteiligten informiert wurden.";
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private String joinList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
            .filter(value -> value != null && !value.isBlank())
            .map(String::trim)
            .reduce((a, b) -> a + "\n" + b)
            .orElse("");
    }

    private String joinPreviewTasks(List<AnalysisPreviewTaskDto> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return "";
        }

        return tasks.stream()
            .filter(task -> task.title() != null && !task.title().isBlank())
            .map(task -> {
                StringBuilder line = new StringBuilder(task.title().trim());

                if (task.assignee() != null && !task.assignee().isBlank()) {
                    line.append(" [").append(task.assignee().trim()).append("]");
                }

                if (task.deadline() != null && !task.deadline().isBlank()) {
                    line.append(" (bis ").append(task.deadline().trim()).append(")");
                }

                if (task.priority() != null && !task.priority().isBlank()) {
                    line.append(" {").append(task.priority().trim()).append("}");
                }

                return line.toString();
            })
            .reduce((a, b) -> a + "\n" + b)
            .orElse("");
    }

    private String joinPreviewDeadlines(List<AnalysisPreviewDeadlineDto> deadlines) {
        if (deadlines == null || deadlines.isEmpty()) {
            return "";
        }

        return deadlines.stream()
            .filter(d -> d.description() != null && !d.description().isBlank())
            .map(d -> {
                StringBuilder line = new StringBuilder(d.description().trim());

                if (d.date() != null && !d.date().isBlank()) {
                    line.append(" (").append(d.date().trim()).append(")");
                } else {
                    line.append(" (Datum unklar)");
                }

                return line.toString();
            })
            .reduce((a, b) -> a + "\n" + b)
            .orElse("");
    }

    private String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}