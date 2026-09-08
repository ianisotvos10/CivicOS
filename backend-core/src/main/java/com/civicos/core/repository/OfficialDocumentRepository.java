package com.civicos.core.repository;

import com.civicos.core.model.OfficialDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OfficialDocumentRepository extends JpaRepository<OfficialDocument, UUID> {
    List<OfficialDocument> findByCitizenCnpOrderByRequestedAtDesc(String citizenCnp);
}
