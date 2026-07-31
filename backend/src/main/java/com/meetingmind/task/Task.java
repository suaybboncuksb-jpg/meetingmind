package com.meetingmind.task;

import jakarta.persistence.*;
import com.meetingmind.user.User;
import com.meetingmind.meeting.Meeting;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id")
    private Meeting meeting;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    private String aiSuggestedAssigneeName;

    private LocalDate deadline;

    @Column(nullable = false)
    private boolean deadlineEstimated;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String priority;

    @Column(nullable = false)
    private boolean aiGenerated;

    @Column(nullable = false)
    private boolean confirmed;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Task() {
        this.status = "OPEN";
        this.priority = "MEDIUM";
        this.deadlineEstimated = false;
        this.aiGenerated = false;
        this.confirmed = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public Meeting getMeeting() { return meeting; }
    public void setMeeting(Meeting meeting) { this.meeting = meeting; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }

    public String getAiSuggestedAssigneeName() { return aiSuggestedAssigneeName; }
    public void setAiSuggestedAssigneeName(String aiSuggestedAssigneeName) { this.aiSuggestedAssigneeName = aiSuggestedAssigneeName; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public boolean isDeadlineEstimated() { return deadlineEstimated; }
    public void setDeadlineEstimated(boolean deadlineEstimated) { this.deadlineEstimated = deadlineEstimated; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public boolean isAiGenerated() { return aiGenerated; }
    public void setAiGenerated(boolean aiGenerated) { this.aiGenerated = aiGenerated; }

    public boolean isConfirmed() { return confirmed; }
    public void setConfirmed(boolean confirmed) { this.confirmed = confirmed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}