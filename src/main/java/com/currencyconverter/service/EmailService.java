package com.currencyconverter.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendWelcomeEmail(String toEmail, String username, String apiKey) {
        if (mailSender == null) {
            // Log fallback in case JavaMailSender is not initialized or deactivated
            System.err.println("SMTP Mail Sender is not configured. API Key for " + username + " is: " + apiKey);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Welcome to ApexConvert | Your Secure API Key");
            
            String body = String.format(
                "Hello %s,\n\n" +
                "Your account has been created successfully on ApexConvert Currency Converter!\n\n" +
                "Your unique secure API Key is:\n" +
                "🔑 %s\n\n" +
                "Use this key in your HTTP header 'X-API-KEY' to perform exchange calculations and look up transaction histories.\n\n" +
                "Best Regards,\n" +
                "The ApexConvert Team",
                username, apiKey
            );
            
            message.setText(body);
            message.setFrom("apexconvert@gmail.com");
            
            mailSender.send(message);
            System.out.println("Welcome email successfully sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send welcome email to: " + toEmail + ". Error: " + e.getMessage());
        }
    }
}
