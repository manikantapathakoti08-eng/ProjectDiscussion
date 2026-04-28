package com.example.skillSwap.service;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.skillSwap.enums.Role;
import com.example.skillSwap.model.User;
import com.example.skillSwap.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    // 1. Sent to Guide when Student requests a topic
    @Async
    public void sendBookingEmail(String to, String guideName, String studentName, String topic) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("🚀 New Project Discussion Request: " + topic);
        message.setText("Hi " + guideName + ",\n\n" +
                studentName + " wants to discuss " + topic + " with you.\n" +
                "Check your dashboard to Accept or Reject this request.");
        mailSender.send(message);
    }

    // 2. Sent to Student when Guide Accepts
    @Async
    public void sendAcceptanceEmail(String to, String studentName, String guideName, String topic) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("✅ Request Accepted!");
        message.setText("Hi " + studentName + ",\n\n" +
                guideName + " has accepted your request for " + topic + ".\n\n" +
                "⏰ IMPORTANT: To keep the session secure, your joining link will be emailed to you " +
                "exactly 5 minutes before the start time.\n\n" + 
                "Get ready for the discussion!");
        mailSender.send(message);
    }

    // 3. Sent for Rejections or Admin Cancellations
    @Async
    public void sendCancellationEmail(String to, String otherPartyName, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("⚠️ Session Update");
        message.setText("The session involving " + otherPartyName + " has been cancelled or rejected.\n" +
                "Reason: " + reason + "\n");
        mailSender.send(message);
    }


    // 4. Sent as a 5-minute reminder before session starts
    @Async
    public void sendReminderEmail(String toEmail, String name, String messageContent) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("manikantapathakoti08@gmail.com"); 
            message.setTo(toEmail);
            message.setSubject("⏰ Friendly Reminder: Session Starting Soon!");
            
            String body = "Hi " + name + ",\n\n"
                        + messageContent + "\n\n"
                        + "Please log in and join the meeting link on time.\n\n"
                        + "Happy Learning,\n"
                        + "The Guide & Student Project App Team";
                        
            message.setText(body);
            mailSender.send(message);
            System.out.println("Reminder email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send reminder email to " + toEmail + ": " + e.getMessage());
        }
    }

  
    // 🚨 🚀 NEW: Dynamic Broadcast to ALL Admins
    @Async
    public void sendDisputeAlertToAdmin(Long sessionId, String studentName, String guideName) {
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            
            if (admins.isEmpty()) {
                System.err.println("⚠️ No Admins found in the database to notify!");
                return;
            }

            String[] adminEmails = admins.stream()
                    .map(User::getEmail)
                    .toArray(String[]::new);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmails); 
            message.setSubject("🚨 ACTION REQUIRED: Session Dispute Raised (ID: " + sessionId + ")");
            
            String body = "Hello Admin Team,\n\n"
                    + "A new dispute has been raised and requires your attention.\n\n"
                    + "Session ID: " + sessionId + "\n"
                    + "Student: " + studentName + "\n"
                    + "Guide: " + guideName + "\n\n"
                    + "Please log in to the Admin Control Panel to review the session.\n\n"
                    + "Project Discussion Automated System";

            message.setText(body);
            mailSender.send(message); 
            
            System.out.println("✅ Dispute Alert Broadcasted to " + adminEmails.length + " Admins!");
        } catch (Exception e) {
            System.err.println("Failed to broadcast Admin dispute alert: " + e.getMessage());
        }
    }

    // 🚨 🚀 NEW: Alert Guide that their session was disputed
    @Async
    public void sendDisputeAlertToGuide(String guideEmail, String guideName, String studentName, Long sessionId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(guideEmail);
            message.setSubject("⚠️ Notice: Session Dispute Raised (ID: " + sessionId + ")");
            
            String body = "Hi " + guideName + ",\n\n"
                    + studentName + " has raised a dispute regarding your recent session (ID: " + sessionId + ").\n"
                    + "Our Admin team will review the case.\n\n"
                    + "If you have any context to provide, please contact support.\n\n"
                    + "Project Discussion App Team";

            message.setText(body);
            mailSender.send(message); 
            System.out.println("✅ Dispute Alert Email sent to Guide!");
        } catch (Exception e) {
            System.err.println("Failed to send Guide dispute alert: " + e.getMessage());
        }
    }

    // 🔑 🚀 NEW: Send OTP for Password Reset
    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("🔑 Your Password Reset OTP");
            
            String body = "Hello,\n\n"
                    + "We received a request to reset your password.\n"
                    + "Your One-Time Password (OTP) is: " + otp + "\n\n"
                    + "This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.\n\n"
                    + "The Team";

            message.setText(body);
            mailSender.send(message); 
            System.out.println("✅ OTP Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
        }
    }

    // 💰 🚀 NEW: Tell the Student their request was DECLINED (Rejection)
    @Async
    public void sendRejectionEmail(String to, String studentName, String guideName, String topic) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("❌ Session Request Update: " + topic);
            
            String body = "Hi " + studentName + ",\n\n"
                    + "We're sorry to inform you that " + guideName + " is unable to take your request for " + topic + " at this time.\n\n"
                    + "You can find another available slot or a different guide.\n\n"
                    + "Keep learning!\n"
                    + "The Team";

            message.setText(body);
            mailSender.send(message);
            System.out.println("✅ Rejection Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send Rejection email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    public void sendOnboardingEmail(String toEmail, String name, String tempPassword, String role) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("🎉 Welcome to SkillSwap - Your Account is Ready!");
            
            String body = "Hi " + name + ",\n\n"
                    + "Your account has been successfully created as a " + role + ".\n\n"
                    + "Please use the following credentials to log in:\n"
                    + "📧 Email: " + toEmail + "\n"
                    + "🔑 Temporary Password: " + tempPassword + "\n\n"
                    + "IMPORTANT: You will be asked to change your password during your first login for security.\n\n"
                    + "Welcome aboard!\n"
                    + "The Admin Team";

            message.setText(body);
            mailSender.send(message); 
            System.out.println("✅ Onboarding Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send onboarding email: " + e.getMessage());
        }
    }
}