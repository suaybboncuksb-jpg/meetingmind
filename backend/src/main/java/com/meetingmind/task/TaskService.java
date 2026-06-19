package com.meetingmind.task;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.meetingmind.user.User;
import com.meetingmind.user.UserRepository;
import com.meetingmind.meeting.Meeting;
import com.meetingmind.meeting.MeetingRepository;
import com.meetingmind.ai.ActionItem;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {

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
            .orElseThrow(() -> new RuntimeException("User not found"));
        return taskRepository.findByOwnerOrderByCreatedAtDesc(user)
            .stream().map(TaskDto::from).toList();
    }

    public TaskDto create(Long userId, Long meetingId, String title, String assignee,
                          String deadline, String status, String priority) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = new Task();
        task.setOwner(user);
        if (meetingId != null) {
            meetingRepository.findById(meetingId).ifPresent(task::setMeeting);
        }
        task.setTitle(title);
        task.setAssignee(emptyToNull(assignee));
        task.setDeadline(parseDate(deadline));
        if (status != null && !status.isBlank()) task.setStatus(status);
        if (priority != null && !priority.isBlank()) task.setPriority(priority);

        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto updateStatus(Long taskId, String status) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        task.setUpdatedAt(LocalDateTime.now());
        return TaskDto.from(taskRepository.save(task));
    }

    public TaskDto update(Long taskId, String title, String assignee,
                          String deadline, String status, String priority) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        if (title != null) task.setTitle(title);
        if (assignee != null) task.setAssignee(emptyToNull(assignee));
        if (deadline != null) task.setDeadline(parseDate(deadline));
        if (status != null && !status.isBlank()) task.setStatus(status);
        if (priority != null && !priority.isBlank()) task.setPriority(priority);
        task.setUpdatedAt(LocalDateTime.now());
        return TaskDto.from(taskRepository.save(task));
    }

    public void delete(Long taskId) {
        taskRepository.deleteById(taskId);
    }

    /** Erzeugt Aufgaben aus den strukturierten Action Items der KI-Analyse (idempotent pro Meeting). */
    @Transactional
    public void createFromActionItems(Meeting meeting, List<ActionItem> items) {
        if (meeting.getCreatedBy() == null) {
            return;
        }
        // Alte (KI-generierte) Aufgaben dieses Meetings entfernen, um Duplikate zu vermeiden
        taskRepository.deleteByMeeting(meeting);

        if (items == null || items.isEmpty()) {
            return;
        }
        for (ActionItem item : items) {
            if (item.title() == null || item.title().isBlank()) continue;

            Task task = new Task();
            task.setOwner(meeting.getCreatedBy());
            task.setMeeting(meeting);
            task.setTitle(item.title().trim());
            task.setAssignee(emptyToNull(item.assignee()));
            task.setDeadline(parseDate(item.deadline()));
            taskRepository.save(task);
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
