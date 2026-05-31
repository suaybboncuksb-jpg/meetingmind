package com.meetingmind.service;

import com.meetingmind.dto.AiAnalysisResponse;
import com.meetingmind.model.Meeting;
import com.meetingmind.model.Task;
import com.meetingmind.repository.MeetingRepository;
import com.meetingmind.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final TaskRepository taskRepository;
    private final GeminiService geminiService;

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

    public Meeting saveMeeting(Meeting meeting) {
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

    public Meeting analyzeMeeting(Long id) {
        Meeting meeting = getMeetingById(id);

        if (meeting.getProtocolText() == null || meeting.getProtocolText().isBlank()) {
            throw new RuntimeException("Meeting-Protokoll ist leer. KI-Analyse nicht möglich.");
        }

        AiAnalysisResponse analysis = geminiService.analyzeMeetingProtocol(meeting.getProtocolText());

        meeting.setAiSummary(buildSummaryText(analysis));

        deleteExistingTasksForMeeting(meeting);
        createTasksFromTodos(meeting, analysis);

        return meetingRepository.save(meeting);
    }

    private String buildSummaryText(AiAnalysisResponse analysis) {
        StringBuilder summaryBuilder = new StringBuilder();

        if (analysis.getSummary() != null && !analysis.getSummary().isBlank()) {
            summaryBuilder.append(analysis.getSummary());
        }

        if (analysis.getDecisions() != null && !analysis.getDecisions().isEmpty()) {
            summaryBuilder.append("\n\nEntscheidungen:\n");
            analysis.getDecisions()
                    .forEach(decision -> summaryBuilder.append("• ").append(decision).append("\n"));
        }

        if (analysis.getOpenQuestions() != null && !analysis.getOpenQuestions().isEmpty()) {
            summaryBuilder.append("\nOffene Fragen:\n");
            analysis.getOpenQuestions()
                    .forEach(question -> summaryBuilder.append("• ").append(question).append("\n"));
        }

        if (analysis.getRisks() != null && !analysis.getRisks().isEmpty()) {
            summaryBuilder.append("\nRisiken:\n");
            analysis.getRisks()
                    .forEach(risk -> summaryBuilder.append("• ").append(risk).append("\n"));
        }

        if (analysis.getNextSteps() != null && !analysis.getNextSteps().isEmpty()) {
            summaryBuilder.append("\nNächste Schritte:\n");
            analysis.getNextSteps()
                    .forEach(nextStep -> summaryBuilder.append("• ").append(nextStep).append("\n"));
        }

        return summaryBuilder.toString();
    }

    private void deleteExistingTasksForMeeting(Meeting meeting) {
        List<Task> existingTasks = taskRepository.findByMeetingId(meeting.getId());

        if (existingTasks != null && !existingTasks.isEmpty()) {
            taskRepository.deleteAll(existingTasks);
        }

        if (meeting.getTasks() != null) {
            meeting.getTasks().clear();
        }
    }

    private void createTasksFromTodos(Meeting meeting, AiAnalysisResponse analysis) {
        if (analysis.getTodos() == null || analysis.getTodos().isEmpty()) {
            return;
        }

        for (AiAnalysisResponse.TodoItem todo : analysis.getTodos()) {
            if (todo.getTask() == null || todo.getTask().isBlank()) {
                continue;
            }

            Task task = new Task();

            task.setTitle(todo.getTask());
            task.setDescription(todo.getTask());
            task.setAssignedTo(normalizeOwner(todo.getOwner()));
            task.setDueDate(normalizeDeadline(todo.getDeadline()));
            task.setStatus(Task.TaskStatus.OPEN);
            task.setPriority(mapPriority(todo.getPriority()));
            task.setMeeting(meeting);

            taskRepository.save(task);
        }
    }

    private String normalizeOwner(String owner) {
        if (owner == null || owner.isBlank()) {
            return "Nicht zugewiesen";
        }

        if (owner.equalsIgnoreCase("nicht genannt")) {
            return "Nicht zugewiesen";
        }

        return owner;
    }

    private String normalizeDeadline(String deadline) {
        if (deadline == null || deadline.isBlank()) {
            return "Nicht genannt";
        }

        if (deadline.equalsIgnoreCase("nicht genannt")) {
            return "Nicht genannt";
        }

        return deadline;
    }

    private Task.TaskPriority mapPriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return Task.TaskPriority.MEDIUM;
        }

        return switch (priority.toLowerCase()) {
            case "hoch", "high" -> Task.TaskPriority.HIGH;
            case "niedrig", "low" -> Task.TaskPriority.LOW;
            default -> Task.TaskPriority.MEDIUM;
        };
    }
}