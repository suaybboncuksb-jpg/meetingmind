package com.meetingmind.meeting;

import java.util.List;

public record MeetingQualityScoreDto(
    int score,
    String label,
    String summary,
    List<MeetingQualityCheckDto> checks,
    List<String> strengths,
    List<String> warnings,
    List<String> recommendations,
    String nextBestAction
) {
}
