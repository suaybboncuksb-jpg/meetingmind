package com.meetingmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

        String geminiResponse = geminiService.analyzeMeetingProtocol(meeting.getProtocolText());

        try {
            JsonNode json = objectMapper.readTree(geminiResponse);

            meeting.setAiSummary(json.path("summary").asText());

            JsonNode tasksNode = json.path("tasks");
            if (tasksNode.isArray()) {
                for (JsonNode taskNode : tasksNode) {
                    Task task = new Task();
                    task.setDescription(taskNode.path("description").asText());
                    task.setAssignedTo(taskNode.path("assignedTo").asText());
                    task.setDueDate(taskNode.path("dueDate").asText());
                    task.setStatus(Task.TaskStatus.OPEN);
                    task.setMeeting(meeting);
                    taskRepository.save(task);
                }
            }

            return meetingRepository.save(meeting);

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Verarbeiten der KI-Antwort: " + e.getMessage());
        }
    }
}