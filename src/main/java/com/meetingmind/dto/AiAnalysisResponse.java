package com.meetingmind.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiAnalysisResponse {

    private String summary;
    private List<TodoItem> todos;
    private List<String> decisions;
    private List<String> openQuestions;
    private List<String> risks;
    private List<String> nextSteps;

    @Data
    public static class TodoItem {
        private String task;
        private String owner;
        private String deadline;
        private String priority;
    }
}