package com.example.skillSwap.scheduler;

import com.example.skillSwap.enums.SessionStatus;
import com.example.skillSwap.model.Session;
import com.example.skillSwap.repository.SessionRepository;
import com.example.skillSwap.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionScheduler {

    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;

    // ⏱️ Runs automatically every 1 minute
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void sendFiveMinuteReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fiveMinsFromNow = now.plusMinutes(5);

        // 1. Find all ACCEPTED sessions starting in the next 5 mins where a reminder hasn't been sent
        List<Session> upcomingSessions = sessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SessionStatus.ACCEPTED)
                .filter(s -> !s.isReminderSent())
                .filter(s -> s.getAvailability() != null)
                .filter(s -> s.getAvailability().getStartTime().isBefore(fiveMinsFromNow) && 
                             s.getAvailability().getStartTime().isAfter(now))
                .toList();

        // 2. Loop through them and send the emails!
        for (Session session : upcomingSessions) {
            String topic = session.getProjectTopic();
            String link = session.getMeetingLink();

            // 📧 Email the Student
            notificationService.sendReminderEmail(
                    session.getStudent().getEmail(),
                    session.getStudent().getName(),
                    "Your " + topic + " discussion with " + session.getGuide().getName() + " starts in 5 minutes! " +
                    "\nJoin your virtual space here: " + link
            );

            // 📧 Email the Guide
            notificationService.sendReminderEmail(
                    session.getGuide().getEmail(),
                    session.getGuide().getName(),
                    "Your " + topic + " discussion with " + session.getStudent().getName() + " starts in 5 minutes! " +
                    "\nJoin your virtual space here: " + link
            );

            // 3. Mark as sent
            session.setReminderSent(true);
            sessionRepository.save(session);
            
            log.info("✅ Sent 5-minute reminders for Session ID: {}", session.getId());
        }
    }
}