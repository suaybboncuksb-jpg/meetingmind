package com.meetingmind.task;

import com.meetingmind.auth.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getUserTasks(Authentication authentication) {
        Long userId = currentUserId(authentication);
        return ResponseEntity.ok(taskService.getUserTasks(userId));
    }

    @PostMapping
    public ResponseEntity<TaskDto> create(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long userId = currentUserId(authentication);
        Long meetingId = toLong(body.get("meetingId"));

        TaskDto created = taskService.create(
            userId,
            meetingId,
            (String) body.get("title"),
            (String) body.get("assignee"),
            (String) body.get("deadline"),
            (String) body.get("status"),
            (String) body.get("priority")
        );

        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDto> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(taskService.update(
            id,
            userId,
            (String) body.get("title"),
            (String) body.get("assignee"),
            (String) body.get("deadline"),
            (String) body.get("status"),
            (String) body.get("priority")
        ));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TaskDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(taskService.updateStatus(id, userId, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        Long userId = currentUserId(authentication);

        taskService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nicht authentifiziert.");
        }

        return user.id();
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
