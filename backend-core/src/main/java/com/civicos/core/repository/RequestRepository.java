package com.civicos.core.repository;

import com.civicos.core.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, UUID> {
    // Permite afișarea tuturor sesizărilor făcute de un anumit cetățean
    List<Request> findByReporterId(UUID reporterId);
    
    // Găsește sesizările unui cetățean după CNP
    List<Request> findByCitizenCnp(String citizenCnp);
    
    // Permite afișarea tuturor sesizărilor care au un anumit status (ex: doar cele OPEN)
    List<Request> findByStatus(Request.RequestStatus status);
}