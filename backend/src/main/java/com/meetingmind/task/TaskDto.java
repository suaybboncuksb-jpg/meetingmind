package com.meetingmind.task;

/** API-Repräsentation einer Aufgabe (ohne Lazy-Entity-Graph). */
public record TaskDto(
    Long id,
    String title,
    Long meetingId,
    String meetingTitle,
    String assignee,
    String deadline,
    String status,
    String priority
) {
    public static TaskDto from(Task t) {
        return new TaskDto(
            t.getId(),
            t.getTitle(),
            t.getMeeting() != null ? t.getMeeting().getId() : null,
            t.getMeeting() != null ? t.getMeeting().getTitle() : null,
            t.getAssignee(),
            t.getDeadline() != null ? t.getDeadline().toString() : null,
            t.getStatus(),
            t.getPriority()
        );
    }
}
