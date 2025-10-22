-- Migration: Add Proctoring System
-- Description: Adds teacher role support and proctoring tables

-- 1. Ensure users table has role column (should already exist based on code)
-- If it doesn't exist, uncomment the following line:
-- ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student';

-- 2. Create proctoring_events table to log suspicious activities
CREATE TABLE IF NOT EXISTS proctoring_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    q_id INT,
    event_type VARCHAR(50) NOT NULL,
    event_details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) DEFAULT 'low',
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (q_id) REFERENCES questions(q_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_q_id (q_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_event_type (event_type)
);

-- 3. Create active_sessions table to track who's solving what
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100),
    q_id INT,
    problem_name VARCHAR(500),
    language VARCHAR(50),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    tab_switches INT DEFAULT 0,
    copy_paste_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (q_id) REFERENCES questions(q_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_last_activity (last_activity)
);

-- 4. Create code_submissions table for similarity detection
CREATE TABLE IF NOT EXISTS code_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    q_id INT NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_plagiarized BOOLEAN DEFAULT FALSE,
    similarity_score FLOAT DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (q_id) REFERENCES questions(q_id) ON DELETE CASCADE,
    INDEX idx_user_q (user_id, q_id),
    INDEX idx_q_id (q_id),
    INDEX idx_submitted_at (submitted_at)
);

-- 5. Create proctoring_settings table for configurable proctoring rules
CREATE TABLE IF NOT EXISTS proctoring_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    q_id INT,
    enable_proctoring BOOLEAN DEFAULT FALSE,
    max_tab_switches INT DEFAULT 3,
    max_copy_paste INT DEFAULT 5,
    disable_devtools BOOLEAN DEFAULT TRUE,
    track_similarity BOOLEAN DEFAULT TRUE,
    similarity_threshold FLOAT DEFAULT 0.85,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (q_id) REFERENCES questions(q_id) ON DELETE CASCADE
);

-- Insert default proctoring setting (global)
INSERT INTO proctoring_settings (q_id, enable_proctoring, max_tab_switches, max_copy_paste) 
VALUES (NULL, TRUE, 5, 10);

