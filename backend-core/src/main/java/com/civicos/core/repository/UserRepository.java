package com.civicos.core.repository;

import com.civicos.core.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCnp(String cnp);
    
    // Găsește toți cetățenii care aparțin de o anumită primărie
    List<User> findByTenantId(UUID tenantId);
}