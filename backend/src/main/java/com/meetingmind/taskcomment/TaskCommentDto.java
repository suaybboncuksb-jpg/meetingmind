package com.meetingmind.taskcomment;

public record TaskCommentDto(
    Long id,
    Long taskId,
    Long authorId,
    String authorName,
    String authorEmail,
    String message,
    String createdAt
) {
    public static TaskCommentDto from(TaskComment comment) {
        String firstName = comment.getAuthor().getFirstName();
        String lastName = comment.getAuthor().getLastName();

        String authorName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();

        if (authorName.isBlank()) {
            authorName = comment.getAuthor().getEmail();
        }

        return new TaskCommentDto(
            comment.getId(),
            comment.getTask().getId(),
            comment.getAuthor().getId(),
            authorName,
            comment.getAuthor().getEmail(),
            comment.getMessage(),
            comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null
        );
    }
}
