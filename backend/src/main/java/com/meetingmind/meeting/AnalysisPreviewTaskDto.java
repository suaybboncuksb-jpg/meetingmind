package com.meetingmind.meeting;

import com.meetingmind.ai.ActionItem;

public record AnalysisPreviewTaskDto(
    String title,
    String assignee,
    String deadline,
    String priority
) {
    public ActionItem toActionItem() {
        return new ActionItem(
            title != null ? title : "",
            assignee != null ? assignee : "",
            deadline != null ? deadline : "",
            priority != null ? priority : "MEDIUM"
        );
    }

    public static AnalysisPreviewTaskDto from(ActionItem item) {
        return new AnalysisPreviewTaskDto(
            item.title(),
            item.assignee(),
            item.deadline(),
            item.priority()
        );
    }
}
