package com.meetingmind.taskcomment;

import com.meetingmind.task.Task;
import com.meetingmind.task.TaskRepository;
import com.meetingmind.user.User;
import com.meetingmind.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskCommentService(TaskCommentRepository taskCommentRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository) {
        this.taskCommentRepository = taskCommentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public List<TaskCommentDto> getComments(Long taskId, Long userId) {
        Task task = getOwnedTask(taskId, userId);

        return taskCommentRepository.findByTaskOrderByCreatedAtAsc(task)
            .stream()
            .map(TaskCommentDto::from)
            .toList();
    }

    public TaskCommentDto createComment(Long taskId, Long userId, String message) {
        Task task = getOwnedTask(taskId, userId);

        User author = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(author);
        comment.setMessage(requireText(message, "Kommentar darf nicht leer sein."));

        return TaskCommentDto.from(taskCommentRepository.save(comment));
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
}
