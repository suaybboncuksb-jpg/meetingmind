package com.meetingmind.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String assignedTo;
    private String dueDate;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.OPEN;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id")
    private Meeting meeting;

    public enum TaskStatus {
        OPEN, IN_PROGRESS, DONE
    }
}
