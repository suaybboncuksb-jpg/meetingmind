package com.meetingmind.taskcomment;

import com.meetingmind.auth.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks/{taskId}/comments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TaskCommentController {

    private final TaskCommentService taskCommentService;

    public TaskCommentController(TaskCommentService taskCommentService) {
        this.taskCommentService = taskCommentService;
    }

    @GetMapping
    public ResponseEntity<List<TaskCommentDto>> getComments(
            @PathVariable Long taskId,
            Authentication authentication) {

        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(taskCommentService.getComments(taskId, userId));
    }

    @PostMapping
    public ResponseEntity<TaskCommentDto> createComment(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Long userId = currentUserId(authentication);

        return ResponseEntity.ok(taskCommentService.createComment(
            taskId,
            userId,
            body.get("message")
        ));
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nicht authentifiziert.");
        }

        return user.id();
    }
}
