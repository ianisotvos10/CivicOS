package com.civicos.core.repository;

import com.civicos.core.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    // Spring Data JPA va genera automat logica de căutare SQL!
    Optional<Tenant> findByDomain(String domain);
}