package com.meetingmind.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.meetingmind.user.User;
import com.meetingmind.meeting.Meeting;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByOwnerOrderByCreatedAtDesc(User owner);
    void deleteByMeeting(Meeting meeting);
}
