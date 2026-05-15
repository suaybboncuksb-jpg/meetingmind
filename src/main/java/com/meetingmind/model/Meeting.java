package com.meetingmind.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "meetings")
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String location;
    private LocalDateTime meetingDate;

    @Column(columnDefinition = "TEXT")
    private String protocolText;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> tasks;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Participant> participants;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}