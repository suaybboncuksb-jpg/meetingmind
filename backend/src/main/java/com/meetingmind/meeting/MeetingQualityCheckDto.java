package com.meetingmind.meeting;

public record MeetingQualityCheckDto(
    String label,
    boolean passed,
    String detail
) {
}
