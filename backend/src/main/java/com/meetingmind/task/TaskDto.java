package com.meetingmind.task;

public record TaskDto(
    Long id,
    String title,
    Long meetingId,
    String meetingTitle,
    String projectName,
    Long assigneeId,
    String assigneeName,
    String aiSuggestedAssigneeName,
    String deadline,
    boolean deadlineEstimated,
    String status,
    String priority,
    boolean aiGenerated,
    boolean confirmed
) {
    public static TaskDto from(Task t) {
        return new TaskDto(
            t.getId(),
            t.getTitle(),
            t.getMeeting() != null ? t.getMeeting().getId() : null,
            t.getMeeting() != null ? t.getMeeting().getTitle() : null,
            t.getMeeting() != null ? t.getMeeting().getProjectName() : null,
            t.getAssignee() != null ? t.getAssignee().getId() : null,
            t.getAssignee() != null ? (t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName()) : null,
            t.getAiSuggestedAssigneeName(),
            t.getDeadline() != null ? t.getDeadline().toString() : null,
            t.isDeadlineEstimated(),
            t.getStatus(),
            t.getPriority(),
            t.isAiGenerated(),
            t.isConfirmed()
        );
    }
}