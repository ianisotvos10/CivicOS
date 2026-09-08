package com.civicos.core.controller;

import com.civicos.core.model.Appointment;
import com.civicos.core.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    // Toate slot-urile posibile 09:00 - 14:30, la 30 min
    private static final List<String> ALL_SLOTS = List.of(
        "09:00","09:30","10:00","10:30","11:00","11:30",
        "12:00","12:30","13:00","13:30","14:00","14:30"
    );

    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(@RequestParam String date) {
        List<Appointment> existing = appointmentRepository.findByAppointmentDateOrderByTimeSlotAsc(date);
        Set<String> bookedSlots = new HashSet<>();
        for (Appointment a : existing) {
            if (!"CANCELLED".equals(a.getStatus())) {
                bookedSlots.add(a.getTimeSlot());
            }
        }
        List<Map<String, Object>> slots = new ArrayList<>();
        for (String slot : ALL_SLOTS) {
            Map<String, Object> s = new HashMap<>();
            s.put("time", slot);
            s.put("available", !bookedSlots.contains(slot));
            slots.add(s);
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("date", date);
        resp.put("slots", slots);
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<?> bookAppointment(@RequestBody Appointment appointment) {
        // Verificam daca slotul e disponibil
        boolean taken = appointmentRepository.existsByAppointmentDateAndTimeSlotAndStatusNot(
            appointment.getAppointmentDate(), appointment.getTimeSlot(), "CANCELLED"
        );
        if (taken) {
            return ResponseEntity.badRequest().body("Slotul " + appointment.getTimeSlot() + " este deja ocupat pentru data " + appointment.getAppointmentDate());
        }
        appointment.setStatus("CONFIRMED");
        Appointment saved = appointmentRepository.save(appointment);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/citizen/{cnp}")
    public List<Appointment> getCitizenAppointments(@PathVariable String cnp) {
        return appointmentRepository.findByCitizenCnpOrderByAppointmentDateAscTimeSlotAsc(cnp);
    }

    @GetMapping("/admin/day")
    public List<Appointment> getAppointmentsByDay(@RequestParam String date) {
        return appointmentRepository.findByAppointmentDateOrderByTimeSlotAsc(date);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable UUID id) {
        return appointmentRepository.findById(id).map(a -> {
            a.setStatus("CANCELLED");
            appointmentRepository.save(a);
            return ResponseEntity.ok("Programarea a fost anulată.");
        }).orElse(ResponseEntity.notFound().build());
    }
}
