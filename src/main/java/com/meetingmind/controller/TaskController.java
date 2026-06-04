package com.meetingmind.controller;

import com.meetingmind.dto.CreateTaskRequest;
import com.meetingmind.dto.TaskResponse;
import com.meetingmind.dto.UpdateTaskStatusRequest;
import com.meetingmind.exception.ValidationException;
import com.meetingmind.model.Task;
import com.meetingmind.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/meeting/{meetingId}")
    public ResponseEntity<List<TaskResponse>> getTasksByMeetingId(@PathVariable Long meetingId) {
        return ResponseEntity.ok(taskService.getTasksByMeetingId(meetingId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @RequestBody UpdateTaskStatusRequest request
    ) {
        Task.TaskStatus status = parseTaskStatus(request);
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    private Task.TaskStatus parseTaskStatus(UpdateTaskStatusRequest request) {
        if (request == null || request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new ValidationException("Status darf nicht leer sein.");
        }

        try {
            return Task.TaskStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Ungültiger Task-Status: " + request.getStatus());
        }
    }
}