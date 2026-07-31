package com.meetingmind.ai;

import java.util.ArrayList;
import java.util.List;

public class MistralAnalysisResult {

    private String summary;
    private String keyPoints;
    private String decisions;
    private String actionItems;
    private String nextSteps;
    private String questions;
    private String deadlines;
    private String rawResponse;

    private boolean successful = true;
    private String errorMessage = "";

    private List<ActionItem> actionItemList = new ArrayList<>();
    private List<DeadlineItem> deadlineList = new ArrayList<>();

    public MistralAnalysisResult(String summary, String keyPoints, String decisions,
            String actionItems, String nextSteps, String questions, String deadlines, String rawResponse) {
        this.summary = summary;
        this.keyPoints = keyPoints;
        this.decisions = decisions;
        this.actionItems = actionItems;
        this.nextSteps = nextSteps;
        this.questions = questions;
        this.deadlines = deadlines;
        this.rawResponse = rawResponse;
    }

    public String getSummary() { return summary; }
    public String getKeyPoints() { return keyPoints; }
    public String getDecisions() { return decisions; }
    public String getActionItems() { return actionItems; }
    public String getNextSteps() { return nextSteps; }
    public String getQuestions() { return questions; }
    public String getDeadlines() { return deadlines; }
    public String getRawResponse() { return rawResponse; }

    public boolean isSuccessful() { return successful; }
    public String getErrorMessage() { return errorMessage; }

    public List<ActionItem> getActionItemList() { return actionItemList; }
    public List<DeadlineItem> getDeadlineList() { return deadlineList; }

    public void setSummary(String summary) { this.summary = summary; }
    public void setKeyPoints(String keyPoints) { this.keyPoints = keyPoints; }
    public void setDecisions(String decisions) { this.decisions = decisions; }
    public void setActionItems(String actionItems) { this.actionItems = actionItems; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }
    public void setQuestions(String questions) { this.questions = questions; }
    public void setDeadlines(String deadlines) { this.deadlines = deadlines; }
    public void setRawResponse(String rawResponse) { this.rawResponse = rawResponse; }

    public void setSuccessful(boolean successful) { this.successful = successful; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public void setActionItemList(List<ActionItem> actionItemList) {
        this.actionItemList = actionItemList != null ? actionItemList : new ArrayList<>();
    }

    public void setDeadlineList(List<DeadlineItem> deadlineList) {
        this.deadlineList = deadlineList != null ? deadlineList : new ArrayList<>();
    }
}