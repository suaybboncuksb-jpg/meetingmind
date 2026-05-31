package com.meetingmind.controller;

import com.meetingmind.dto.TaskResponse;
import com.meetingmind.model.Task;
import com.meetingmind.service.TaskService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;

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
        Task.TaskStatus status = Task.TaskStatus.valueOf(request.getStatus());
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UpdateTaskStatusRequest {
        private String status;
    }
}