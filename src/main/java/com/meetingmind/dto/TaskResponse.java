package com.meetingmind.dto;

import com.meetingmind.model.Task;
import lombok.Data;

@Data
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private String assignedTo;
    private String dueDate;
    private String status;
    private String priority;
    private Long meetingId;
    private String meetingTitle;

    public static TaskResponse from(Task task) {
        TaskResponse response = new TaskResponse();

        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setAssignedTo(task.getAssignedTo());
        response.setDueDate(task.getDueDate());

        if (task.getStatus() != null) {
            response.setStatus(task.getStatus().name());
        }

        if (task.getPriority() != null) {
            response.setPriority(task.getPriority().name());
        }

        if (task.getMeeting() != null) {
            response.setMeetingId(task.getMeeting().getId());
            response.setMeetingTitle(task.getMeeting().getTitle());
        }

        return response;
    }
}