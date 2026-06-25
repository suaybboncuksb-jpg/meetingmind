package com.meetingmind.meeting;

import com.meetingmind.transcript.Transcript;

import java.util.Arrays;
import java.util.List;

public record MeetingAnalysisDto(
    Long meetingId,
    String analysisStatus,
    String summary,
    List<String> keyPoints,
    List<String> decisions,
    List<String> actionItems,
    List<String> nextSteps,
    List<String> questions,
    String createdAt,
    String updatedAt
) {
    public static MeetingAnalysisDto empty(Long meetingId) {
        return new MeetingAnalysisDto(
            meetingId,
            "PENDING",
            "",
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            null,
            null
        );
    }

    public static MeetingAnalysisDto from(Long meetingId, Transcript transcript) {
        if (transcript == null) {
            return empty(meetingId);
        }

        return new MeetingAnalysisDto(
            meetingId,
            transcript.getAnalysisStatus(),
            transcript.getSummary() != null ? transcript.getSummary() : "",
            splitLines(transcript.getKeyPoints()),
            splitLines(transcript.getDecisions()),
            splitLines(transcript.getActionItems()),
            splitLines(transcript.getNextSteps()),
            splitLines(transcript.getQuestions()),
            transcript.getCreatedAt() != null ? transcript.getCreatedAt().toString() : null,
            transcript.getUpdatedAt() != null ? transcript.getUpdatedAt().toString() : null
        );
    }

    private static List<String> splitLines(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split("\\R"))
            .map(String::trim)
            .filter(line -> !line.isBlank())
            .toList();
    }
}
