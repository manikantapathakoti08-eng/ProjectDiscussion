package com.example.skillSwap.config;

import com.example.skillSwap.enums.Role;
import com.example.skillSwap.model.User;
import com.example.skillSwap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // 🛠️ MIGRATION: Convert legacy roles to new roles
        System.out.println("🔄 Checking for legacy role data...");
        try {
            // 0. Drop old check constraints and obsolete columns (Postgres specific)
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1");
                jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN credits DROP NOT NULL"); // Make it nullable first if needed
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS credits");
            } catch (Exception ignored) {}

            // 1. Migrate Roles
            jdbcTemplate.execute("UPDATE users SET role = 'GUIDE' WHERE role = 'MENTOR'");
            jdbcTemplate.execute("UPDATE users SET role = 'STUDENT' WHERE role = 'USER'");
            jdbcTemplate.execute("UPDATE users SET role = 'STUDENT' WHERE role = 'LEARNER'");
            
            // 2. Migrate sessions table: rename columns if they exist
            try {
                jdbcTemplate.execute("ALTER TABLE sessions RENAME COLUMN skill_name TO topic_name");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE sessions RENAME COLUMN learner_id TO student_id");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE sessions RENAME COLUMN mentor_id TO guide_id");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE availabilities RENAME COLUMN mentor_id TO guide_id");
            } catch (Exception ignored) {}

            // 3. Migrate user skills to topics
            try {
                // If user_profile_topics exists and is empty, and user_skills exists, copy data
                long topicCount = jdbcTemplate.queryForObject("SELECT count(*) FROM user_profile_topics", Long.class);
                if (topicCount == 0) {
                    jdbcTemplate.execute("INSERT INTO user_profile_topics (user_id, topic_name) SELECT user_id, skill FROM user_skills");
                }
            } catch (Exception ignored) {}

            System.out.println("✅ Database migration complete!");
        } catch (Exception e) {
            System.err.println("Migration skipped or failed (might be first run): " + e.getMessage());
        }

        // 4. Seed missing system accounts
        seedUserIfMissing("manikantapathakoti08@gmail.com", "System Admin", "Mani@062004", Role.ADMIN, null, null);

        System.out.println("✅ Data seeding check complete!");
    }

    private void seedUserIfMissing(String email, String name, String password, Role role, String bio, List<String> topics) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .bio(bio)
                    .topics(topics)
                    .build();
            userRepository.save(user);
            System.out.println("👤 Created missing user: " + email);
        }
    }
}