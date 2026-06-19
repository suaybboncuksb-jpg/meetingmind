package com.meetingmind.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.meetingmind.user.User;
import com.meetingmind.meeting.Meeting;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByOwnerOrderByCreatedAtDesc(User owner);
    Optional<Task> findByIdAndOwner_Id(Long id, Long ownerId);
    void deleteByMeeting(Meeting meeting);
}
