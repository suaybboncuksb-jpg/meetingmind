package com.meetingmind.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:no-reply@meetingmind.local}")
    private String from;

    public MailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendVerificationEmail(String to, String token) {
        String verifyUrl = frontendUrl + "/verify-email?token=" + token;

        String subject = "MeetingMind - E-Mail-Adresse bestätigen";
        String text = """
                Hallo,

                bitte bestätige deine E-Mail-Adresse, um dein MeetingMind-Konto zu aktivieren.

                Klicke dafür auf diesen Link:
                %s

                Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.

                Viele Grüße
                Dein MeetingMind Team
                """.formatted(verifyUrl);

        sendOrPrint(to, subject, text, verifyUrl);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        String subject = "MeetingMind - Passwort zurücksetzen";
        String text = """
                Hallo,

                du hast angefordert, dein Passwort zurückzusetzen.

                Klicke auf diesen Link, um ein neues Passwort zu erstellen:
                %s

                Falls du das nicht warst, kannst du diese E-Mail ignorieren.

                Viele Grüße
                Dein MeetingMind Team
                """.formatted(resetUrl);

        sendOrPrint(to, subject, text, resetUrl);
    }

    private void sendOrPrint(String to, String subject, String text, String url) {
        if (!mailEnabled) {
            System.out.println();
            System.out.println("========================================");
            System.out.println("MEETINGMIND DEV MAIL");
            System.out.println("To: " + to);
            System.out.println("Subject: " + subject);
            System.out.println("Link: " + url);
            System.out.println("========================================");
            System.out.println();
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailSender == null) {
            throw new IllegalStateException("Mailversand ist aktiviert, aber JavaMailSender ist nicht konfiguriert.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }
}