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
    private String rawResponse;

    /** Strukturierte Action Items (inkl. Deadline) für die Aufgaben-Erzeugung. */
    private List<ActionItem> actionItemList = new ArrayList<>();

    public MistralAnalysisResult(String summary, String keyPoints, String decisions,
                                 String actionItems, String nextSteps, String questions, String rawResponse) {
        this.summary = summary;
        this.keyPoints = keyPoints;
        this.decisions = decisions;
        this.actionItems = actionItems;
        this.nextSteps = nextSteps;
        this.questions = questions;
        this.rawResponse = rawResponse;
    }

    // Getter
    public String getSummary() { return summary; }
    public String getKeyPoints() { return keyPoints; }
    public String getDecisions() { return decisions; }
    public String getActionItems() { return actionItems; }
    public String getNextSteps() { return nextSteps; }
    public String getQuestions() { return questions; }
    public String getRawResponse() { return rawResponse; }

    public List<ActionItem> getActionItemList() { return actionItemList; }
    public void setActionItemList(List<ActionItem> actionItemList) { this.actionItemList = actionItemList; }

    // Setter
    public void setSummary(String summary) { this.summary = summary; }
    public void setKeyPoints(String keyPoints) { this.keyPoints = keyPoints; }
    public void setDecisions(String decisions) { this.decisions = decisions; }
    public void setActionItems(String actionItems) { this.actionItems = actionItems; }
    public void setNextSteps(String nextSteps) { this.nextSteps = nextSteps; }
    public void setQuestions(String questions) { this.questions = questions; }
    public void setRawResponse(String rawResponse) { this.rawResponse = rawResponse; }
}
