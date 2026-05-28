package com.meetingmind.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MeetingRequest {
    private String title;
    private String location;
    private LocalDateTime meetingDate;
    private String protocolText;
    private List<String> participants;
}
