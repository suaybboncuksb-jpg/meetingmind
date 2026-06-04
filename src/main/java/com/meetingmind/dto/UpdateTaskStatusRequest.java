package com.meetingmind.dto;

public class UpdateTaskStatusRequest {

    private String status;

    public UpdateTaskStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}