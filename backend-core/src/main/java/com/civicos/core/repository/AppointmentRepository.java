package com.civicos.core.repository;

import com.civicos.core.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByAppointmentDateOrderByTimeSlotAsc(String date);
    List<Appointment> findByCitizenCnpOrderByAppointmentDateAscTimeSlotAsc(String cnp);
    boolean existsByAppointmentDateAndTimeSlotAndStatusNot(String date, String timeSlot, String status);
}
