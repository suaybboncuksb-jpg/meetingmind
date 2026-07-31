package com.meetingmind.meeting;

import com.meetingmind.ai.DeadlineItem;

public record AnalysisPreviewDeadlineDto(
    String description,
    String date
) {
    public DeadlineItem toDeadlineItem() {
        return new DeadlineItem(
            description != null ? description : "",
            date != null ? date : ""
        );
    }

    public static AnalysisPreviewDeadlineDto from(DeadlineItem item) {
        return new AnalysisPreviewDeadlineDto(item.description(), item.date());
    }
}