#!/bin/bash
cat << 'INNER_EOF' > /tmp/patch.txt
    @PrePersist
    protected void onCreate() {
        if (this.registrationNumber == null) {
            this.registrationNumber = "REG-" + java.time.Year.now().getValue() + "-" + String.format("%05d", (int)(Math.random() * 99999));
        }
        if (this.qrVerificationCode == null) {
            this.qrVerificationCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
INNER_EOF
sed -i '45,49c\
    @PrePersist\
    protected void onCreate() {\
        if (this.registrationNumber == null) {\
            this.registrationNumber = "REG-" + java.time.Year.now().getValue() + "-" + String.format("%05d", (int)(Math.random() * 99999));\
        }\
        if (this.qrVerificationCode == null) {\
            this.qrVerificationCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();\
        }\
    }' /root/CivicOS/backend-core/src/main/java/com/civicos/core/model/OfficialDocument.java
