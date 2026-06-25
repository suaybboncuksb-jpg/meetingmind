package com.meetingmind.meeting;

import com.meetingmind.ai.MistralAnalysisResult;

import java.util.Arrays;
import java.util.List;

public record AnalysisPreviewDto(
    Long meetingId,
    String transcript,
    String summary,
    List<String> keyPoints,
    List<String> decisions,
    List<AnalysisPreviewTaskDto> actionItems,
    List<String> nextSteps,
    List<String> questions,
    String rawResponse
) {
    public static AnalysisPreviewDto from(Long meetingId, String transcript, MistralAnalysisResult result) {
        return new AnalysisPreviewDto(
            meetingId,
            transcript,
            result.getSummary(),
            splitLines(result.getKeyPoints()),
            splitLines(result.getDecisions()),
            result.getActionItemList()
                .stream()
                .map(AnalysisPreviewTaskDto::from)
                .toList(),
            splitLines(result.getNextSteps()),
            splitLines(result.getQuestions()),
            result.getRawResponse()
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
