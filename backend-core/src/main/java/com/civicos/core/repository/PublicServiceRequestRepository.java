package com.civicos.core.repository;

import com.civicos.core.model.PublicServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PublicServiceRequestRepository extends JpaRepository<PublicServiceRequest, UUID> {
    List<PublicServiceRequest> findByCitizenCnpOrderByCreatedAtDesc(String citizenCnp);
    List<PublicServiceRequest> findAllByOrderByCreatedAtDesc();
}

