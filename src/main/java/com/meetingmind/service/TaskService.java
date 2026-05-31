package com.meetingmind.service;

import com.meetingmind.dto.TaskResponse;
import com.meetingmind.model.Task;
import com.meetingmind.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAllByOrderByIdDesc()
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> getTasksByMeetingId(Long meetingId) {
        return taskRepository.findByMeetingId(meetingId)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse updateTaskStatus(Long id, Task.TaskStatus status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task nicht gefunden: " + id));

        task.setStatus(status);

        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}