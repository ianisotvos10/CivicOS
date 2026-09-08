package com.civicos.core.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendStatusUpdate(String toEmail, String citizenName, String requestTitle, String newStatus) {
        if (mailSender == null || toEmail == null || toEmail.isBlank()) {
            log.warn("Email sender neconfigurat sau email lipsa - skip.");
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom("noreply@civicos.ro");
            helper.setSubject("CivicOS — Actualizare sesizare: " + requestTitle);
            String statusLabel = switch (newStatus) {
                case "IN_PROGRESS" -> "In curs de rezolvare";
                case "RESOLVED" -> "Rezolvata";
                case "REJECTED" -> "Respinsa";
                default -> newStatus;
            };
            String htmlBody = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                + "<div style='background:#2563eb;color:white;padding:24px;border-radius:8px 8px 0 0'>"
                + "<h1 style='margin:0;font-size:22px'>CivicOS</h1></div>"
                + "<div style='padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>"
                + "<p>Buna ziua, <strong>" + citizenName + "</strong>,</p>"
                + "<p>Sesizarea dumneavoastra a primit o actualizare:</p>"
                + "<div style='background:#f3f4f6;border-left:4px solid #2563eb;padding:16px;border-radius:4px;margin:16px 0'>"
                + "<p style='margin:0'><strong>Sesizare:</strong> " + requestTitle + "</p>"
                + "<p style='margin:8px 0 0 0'><strong>Status nou:</strong> <span style='color:#2563eb;font-weight:bold'>" + statusLabel + "</span></p>"
                + "</div><p>Urmariti stadiul pe platforma CivicOS.</p></div></div>";
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email trimis la: {}", toEmail);
        } catch (Exception e) {
            log.error("Eroare email: {}", e.getMessage());
        }
    }

    public void sendAppointmentConfirmation(String toEmail, String citizenName, String date, String timeSlot, String purpose) {
        if (mailSender == null || toEmail == null || toEmail.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom("noreply@civicos.ro");
            helper.setSubject("CivicOS — Confirmare programare " + date + " ora " + timeSlot);
            String htmlBody = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                + "<div style='background:#2563eb;color:white;padding:24px;border-radius:8px 8px 0 0'>"
                + "<h1 style='margin:0'>CivicOS</h1></div>"
                + "<div style='padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>"
                + "<p>Buna ziua, <strong>" + citizenName + "</strong>,</p>"
                + "<p>Programarea a fost confirmata:</p>"
                + "<div style='background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;margin:16px 0'>"
                + "<p>Data: <strong>" + date + "</strong></p>"
                + "<p>Ora: <strong>" + timeSlot + "</strong></p>"
                + "<p>Scop: <strong>" + (purpose != null ? purpose : "Nespecificat") + "</strong></p>"
                + "</div><p>Prezentati-va cu 5 minute inainte.</p></div></div>";
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Eroare email confirmare: {}", e.getMessage());
        }
    }
}
