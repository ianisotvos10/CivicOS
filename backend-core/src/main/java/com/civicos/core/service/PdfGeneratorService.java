package com.civicos.core.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class PdfGeneratorService {

    public byte[] generateReceipt(String cnp, String taxType, Double amount, UUID taxId) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

            Paragraph header = new Paragraph("PRIMARIA CIVICOS - DEPARTAMENT TAXE", boldFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);
            
            document.add(new Paragraph("\n"));
            Paragraph title = new Paragraph("CHITANTA PLATA ELECTRONICA", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n\n"));

            document.add(new Paragraph("Referinta Tranzactie: " + taxId.toString(), textFont));
            document.add(new Paragraph("Data platii: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")), textFont));
            document.add(new Paragraph("Cetatean (CNP): " + cnp, textFont));
            document.add(new Paragraph("Reprezentand: " + taxType, textFont));
            
            document.add(new Paragraph("\n"));
            Paragraph suma = new Paragraph("SUMA ACHITATA: " + amount + " RON", boldFont);
            document.add(suma);

            document.add(new Paragraph("\n\n"));
            Paragraph footer = new Paragraph("Document emis automat prin portalul Zero Birocratie CivicOS. Nu necesita stampila conform legii.", textFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Eroare generare PDF chitanta", e);
        }
    }

    public byte[] generateOfficialDocument(String citizenName, String cnp, String docType, UUID docId) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

            Paragraph header = new Paragraph("ROMANIA\nPRIMARIA CIVICOS", boldFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);
            document.add(new Paragraph("\n"));

            Paragraph title = new Paragraph(docType.toUpperCase(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n\n"));

            Paragraph body = new Paragraph("Se adevereste prin prezenta de catre departamentul de specialitate ca domnul/doamna ", textFont);
            body.add(new Chunk(citizenName, boldFont));
            body.add(new Chunk(", legitimat(a) cu CNP ", textFont));
            body.add(new Chunk(cnp, boldFont));
            body.add(new Chunk(" figureaza in evidentele noastre cu date la zi si fara datorii restante la bugetul local.\n\nPrezentul document a fost eliberat exclusiv prin platforma digitala CivicOS la cererea cetateanului, pentru a-i servi la institutiile solicitante.", textFont));
            body.setLeading(20f);
            document.add(body);

            document.add(new Paragraph("\n\n"));
            document.add(new Paragraph("Data eliberarii: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")), textFont));
            document.add(new Paragraph("Numar inregistrare: " + docId.toString().substring(0, 8).toUpperCase(), textFont));

            document.add(new Paragraph("\n\n\n"));
            Paragraph footer = new Paragraph("Semnatura Digitala Primaria CivicOS\nValabil electronic", boldFont);
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Eroare generare PDF document oficial", e);
        }
    }
}
