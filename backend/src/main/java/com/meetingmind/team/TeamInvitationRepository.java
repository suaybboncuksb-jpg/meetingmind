package com.meetingmind.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, Long> {
    List<TeamInvitation> findByWorkspaceNameIgnoreCaseOrderByCreatedAtDesc(String workspaceName);

    boolean existsByWorkspaceNameIgnoreCaseAndEmailIgnoreCaseAndStatus(
        String workspaceName,
        String email,
        String status
    );
}
