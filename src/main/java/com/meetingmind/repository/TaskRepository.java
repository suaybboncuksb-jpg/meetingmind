package com.meetingmind.repository;

import com.meetingmind.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByMeetingId(Long meetingId);

    List<Task> findAllByOrderByIdDesc();

    List<Task> findByAssignedUserIdOrderByIdDesc(Long assignedUserId);
}