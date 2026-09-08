package com.civicos.core.repository;

import com.civicos.core.model.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PollVoteRepository extends JpaRepository<PollVote, UUID> {
    List<PollVote> findByPollId(UUID pollId);
    boolean existsByPollIdAndCitizenCnp(UUID pollId, String citizenCnp);
    long countByPollIdAndOptionIndex(UUID pollId, Integer optionIndex);
}
