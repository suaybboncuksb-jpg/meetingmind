package com.meetingmind.meeting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.meetingmind.user.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByCreatedByOrderByMeetingDateDesc(User user);
    List<Meeting> findByStatus(String status);

    Optional<Meeting> findByIdAndCreatedBy_Id(Long id, Long createdById);
}
