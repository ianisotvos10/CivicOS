package com.civicos.core.repository;

import com.civicos.core.model.CitizenProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CitizenProfileRepository extends JpaRepository<CitizenProfile, UUID> {
    Optional<CitizenProfile> findByCnp(String cnp);
}
