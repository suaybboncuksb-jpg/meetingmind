package com.meetingmind.service;

import com.meetingmind.dto.CreateTaskRequest;
import com.meetingmind.dto.TaskResponse;
import com.meetingmind.exception.ResourceNotFoundException;
import com.meetingmind.exception.ValidationException;
import com.meetingmind.model.Meeting;
import com.meetingmind.model.Task;
import com.meetingmind.model.User;
import com.meetingmind.repository.MeetingRepository;
import com.meetingmind.repository.TaskRepository;
import com.meetingmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;

    public TaskResponse createTask(CreateTaskRequest request) {
        validateCreateTaskRequest(request);

        Task task = buildTaskFromRequest(request);

        if (request.getMeetingId() != null) {
            Meeting meeting = meetingRepository.findById(request.getMeetingId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Meeting nicht gefunden: " + request.getMeetingId()
                    ));

            task.setMeeting(meeting);
        }

        if (request.getAssignedUserId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Zugewiesener Benutzer nicht gefunden: " + request.getAssignedUserId()
                    ));

            task.setAssignedUser(assignedUser);
            task.setAssignedTo(assignedUser.getName());
        }

        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    public TaskResponse createTaskForCurrentUser(CreateTaskRequest request, String currentUserEmail) {
        validateCreateTaskRequest(request);

        User currentUser = userRepository.findByEmail(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer nicht gefunden."));

        Task task = buildTaskFromRequest(request);
        task.setAssignedUser(currentUser);
        task.setAssignedTo(currentUser.getName());

        if (request.getMeetingId() != null) {
            Meeting meeting = meetingRepository.findById(request.getMeetingId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Meeting nicht gefunden: " + request.getMeetingId()
                    ));

            task.setMeeting(meeting);
        }

        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAllByOrderByIdDesc()
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> getMyTasks(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer nicht gefunden."));

        return taskRepository.findByAssignedUserIdOrderByIdDesc(currentUser.getId())
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> getTasksByMeetingId(Long meetingId) {
        if (!meetingRepository.existsById(meetingId)) {
            throw new ResourceNotFoundException("Meeting nicht gefunden: " + meetingId);
        }

        return taskRepository.findByMeetingId(meetingId)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse updateTaskStatus(Long id, Task.TaskStatus status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task nicht gefunden: " + id));

        task.setStatus(status);

        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task nicht gefunden: " + id);
        }

        taskRepository.deleteById(id);
    }

    private Task buildTaskFromRequest(CreateTaskRequest request) {
        Task task = new Task();

        task.setTitle(request.getTitle().trim());
        task.setDescription(trimOrNull(request.getDescription()));
        task.setAssignedTo(trimOrNull(request.getAssignedTo()));
        task.setDueDate(trimOrNull(request.getDueDate()));
        task.setStatus(parseStatusOrDefault(request.getStatus()));
        task.setPriority(parsePriorityOrDefault(request.getPriority()));

        return task;
    }

    private void validateCreateTaskRequest(CreateTaskRequest request) {
        if (request == null) {
            throw new ValidationException("Task-Daten dürfen nicht leer sein.");
        }

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new ValidationException("Titel darf nicht leer sein.");
        }
    }

    private Task.TaskStatus parseStatusOrDefault(String status) {
        if (status == null || status.trim().isEmpty()) {
            return Task.TaskStatus.OPEN;
        }

        try {
            return Task.TaskStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Ungültiger Task-Status: " + status);
        }
    }

    private Task.TaskPriority parsePriorityOrDefault(String priority) {
        if (priority == null || priority.trim().isEmpty()) {
            return Task.TaskPriority.MEDIUM;
        }

        try {
            return Task.TaskPriority.valueOf(priority.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Ungültige Task-Priorität: " + priority);
        }
    }

    private String trimOrNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}