package com.meetingmind.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        AiAnalysisResponse analysis = geminiService.analyzeMeetingProtocol(meeting.getProtocolText());

        // Summary mit allen Feldern aufbauen
        StringBuilder summaryBuilder = new StringBuilder();
        summaryBuilder.append(analysis.getSummary());

        if (analysis.getDecisions() != null && !analysis.getDecisions().isEmpty()) {
            summaryBuilder.append("\n\nEntscheidungen:\n");
            analysis.getDecisions().forEach(d -> summaryBuilder.append("• ").append(d).append("\n"));
        }
        if (analysis.getOpenQuestions() != null && !analysis.getOpenQuestions().isEmpty()) {
            summaryBuilder.append("\nOffene Fragen:\n");
            analysis.getOpenQuestions().forEach(q -> summaryBuilder.append("• ").append(q).append("\n"));
        }
        if (analysis.getRisks() != null && !analysis.getRisks().isEmpty()) {
            summaryBuilder.append("\nRisiken:\n");
            analysis.getRisks().forEach(r -> summaryBuilder.append("• ").append(r).append("\n"));
        }
        if (analysis.getNextSteps() != null && !analysis.getNextSteps().isEmpty()) {
            summaryBuilder.append("\nNächste Schritte:\n");
            analysis.getNextSteps().forEach(n -> summaryBuilder.append("• ").append(n).append("\n"));
        }

        meeting.setAiSummary(summaryBuilder.toString());

        // Bestehende Tasks löschen
        if (meeting.getTasks() != null) {
            taskRepository.deleteAll(meeting.getTasks());
        }

        // Todos speichern
        if (analysis.getTodos() != null) {
            for (AiAnalysisResponse.TodoItem todo : analysis.getTodos()) {
                Task task = new Task();
                task.setDescription(todo.getTask());
                task.setAssignedTo(todo.getOwner());
                task.setDueDate(todo.getDeadline());
                task.setStatus(Task.TaskStatus.OPEN);
                task.setMeeting(meeting);
                taskRepository.save(task);
            }
        }

        return meetingRepository.save(meeting);
    }
}