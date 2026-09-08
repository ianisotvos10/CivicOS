package com.civicos.core.repository;

import com.civicos.core.model.RequestEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RequestEventRepository extends JpaRepository<RequestEvent, UUID> {
    List<RequestEvent> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
