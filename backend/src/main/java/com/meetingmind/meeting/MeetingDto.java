package com.meetingmind.meeting;

/** API-Repräsentation eines Meetings (ohne Entity-Graph / Lazy-Proxys / Passwort). */
public record MeetingDto(
    Long id,
    String title,
    String description,
    String projectName,
    String status,
    String aiSummary,
    String transcript,
    String meetingDate,
    String createdAt,
    String updatedAt
) {
    public static MeetingDto from(Meeting m) {
        return new MeetingDto(
            m.getId(),
            m.getTitle(),
            m.getDescription(),
            m.getProjectName(),
            m.getStatus(),
            m.getAiSummary(),
            m.getTranscript(),
            m.getMeetingDate() != null ? m.getMeetingDate().toString() : null,
            m.getCreatedAt() != null ? m.getCreatedAt().toString() : null,
            m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null
        );
    }
}
