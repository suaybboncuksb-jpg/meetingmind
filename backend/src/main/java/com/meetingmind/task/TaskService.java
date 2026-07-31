package com.meetingmind.task;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.meetingmind.user.User;
import com.meetingmind.user.UserRepository;
import com.meetingmind.meeting.Meeting;
import com.meetingmind.meeting.MeetingRepository;
import com.meetingmind.ai.ActionItem;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class TaskService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("OPEN", "IN_PROGRESS", "DONE");
    private static final Set<String> ALLOWED_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH");

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;

    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       MeetingRepository meetingRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.meetingRepository = meetingRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getUserTasks(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return taskRepository.findByOwnerOrderByCreatedAtDesc(user)
            .stream().map(TaskDto::from).toList();
    }

    public TaskDto create(Long userId, Long meetingId, String title, Long assigneeId,
                          String deadline, String status, String priority) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Task task = new Task();
        task.setOwner(user);

        if (meetingId != null) {
            Meeting meeting = meetingRepository.findByIdAndCreatedBy_Id(meetingId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));

            task.setMeeting(meeting);
        }

        task.setTitle(requireText(title, "Task-Titel darf nicht leer sein."));
        task.setAssignee(resolveAssigneeById(assigneeId));
        task.setDeadline(parseDate(deadline));

        task.setAiGenerated(false);
        task.setConfirmed(true);

        if (status != null && !status.isBlank()) {
            task.setStatus(normalizeStatus(status));
        }

        if (priority != null && !priority.isBlank()) {
            task.setPriority(normalizePriority(priority));
        }

        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto updateStatus(Long taskId, Long userId, String status) {
        Task task = getOwnedTask(taskId, userId);

        task.setStatus(normalizeStatus(status));
        task.setUpdatedAt(LocalDateTime.now());

        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto update(Long taskId, Long userId, String title, Long assigneeId,
                          String deadline, String status, String priority) {
        Task task = getOwnedTask(taskId, userId);

        if (title != null) task.setTitle(requireText(title, "Task-Titel darf nicht leer sein."));
        if (assigneeId != null) {
            task.setAssignee(resolveAssigneeById(assigneeId));
            task.setAiSuggestedAssigneeName(null);
        }
        if (deadline != null) {
            task.setDeadline(parseDate(deadline));
            task.setDeadlineEstimated(false);
        }
        if (status != null && !status.isBlank()) task.setStatus(normalizeStatus(status));
        if (priority != null && !priority.isBlank()) task.setPriority(normalizePriority(priority));

        task.setConfirmed(true);
        task.setUpdatedAt(LocalDateTime.now());

        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto confirm(Long taskId, Long userId) {
        Task task = getOwnedTask(taskId, userId);
        task.setConfirmed(true);
        task.setUpdatedAt(LocalDateTime.now());
        return TaskDto.from(taskRepository.save(task));
    }

    public void delete(Long taskId, Long userId) {
        Task task = getOwnedTask(taskId, userId);
        taskRepository.delete(task);
    }

    @Transactional
    public void createFromActionItems(Meeting meeting, List<ActionItem> items) {
        if (meeting.getCreatedBy() == null) {
            return;
        }

        taskRepository.deleteByMeeting(meeting);

        if (items == null || items.isEmpty()) {
            return;
        }

        String workspaceName = meeting.getCreatedBy().getWorkspaceName();

        for (ActionItem item : items) {
            if (item.title() == null || item.title().isBlank()) continue;

            Task task = new Task();
            task.setOwner(meeting.getCreatedBy());
            task.setMeeting(meeting);
            task.setTitle(item.title().trim());
            task.setAiGenerated(true);
            task.setConfirmed(false);

            String suggestedName = item.assignee();
            if (suggestedName != null && !suggestedName.isBlank()) {
                User matched = resolveAssigneeByName(workspaceName, suggestedName);

                if (matched != null) {
                    task.setAssignee(matched);
                } else {
                    task.setAiSuggestedAssigneeName(suggestedName.trim());
                }
            }

            task.setDeadline(parseDate(item.deadline()));
            if (task.getDeadline() != null) {
                task.setDeadlineEstimated(true);
            }

            if (item.priority() != null && !item.priority().isBlank()) {
                task.setPriority(normalizePriority(item.priority()));
            }

            taskRepository.save(task);
        }
    }

    private User resolveAssigneeByName(String workspaceName, String suggestedName) {
        if (workspaceName == null || workspaceName.isBlank()) {
            return null;
        }

        List<User> colleagues = userRepository.findByWorkspaceNameIgnoreCaseOrderByCreatedAtAsc(workspaceName);
        String normalizedTarget = suggestedName.trim().toLowerCase();

        List<User> matches = colleagues.stream()
            .filter(u -> {
                String firstName = u.getFirstName() == null ? "" : u.getFirstName().toLowerCase();
                String fullName = (u.getFirstName() == null ? "" : u.getFirstName().toLowerCase())
                    + " "
                    + (u.getLastName() == null ? "" : u.getLastName().toLowerCase());

                return normalizedTarget.equals(firstName)
                    || normalizedTarget.equals(fullName.trim())
                    || normalizedTarget.contains(firstName) && !firstName.isBlank();
            })
            .toList();

        return matches.size() == 1 ? matches.get(0) : null;
    }

    private User resolveAssigneeById(Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }

        return userRepository.findById(assigneeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zugewiesener Nutzer wurde nicht gefunden."));
    }

    private Task getOwnedTask(Long taskId, Long userId) {
        return taskRepository.findByIdAndOwner_Id(taskId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private String normalizeStatus(String value) {
        String normalized = requireText(value, "Status darf nicht leer sein.").toUpperCase();

        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Ungültiger Status. Erlaubt sind: OPEN, IN_PROGRESS, DONE."
            );
        }

        return normalized;
    }

    private String normalizePriority(String value) {
        String normalized = requireText(value, "Priorität darf nicht leer sein.").toUpperCase();

        if (!ALLOWED_PRIORITIES.contains(normalized)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Ungültige Priorität. Erlaubt sind: LOW, MEDIUM, HIGH."
            );
        }

        return normalized;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;

        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Ungültiges Deadline-Format. Bitte YYYY-MM-DD verwenden."
            );
        }
    }
}