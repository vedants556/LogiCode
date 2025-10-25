# LogiCode Database Schema

This document provides the complete database schema for the LogiCode application, including all tables, relationships, and constraints.

## Database: `logicode`

## Core Tables

### 1. `users` - User Management

```sql
CREATE TABLE users (
    userid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) DEFAULT NULL,
    email VARCHAR(200) DEFAULT NULL UNIQUE,
    password VARCHAR(1000) DEFAULT NULL,
    role VARCHAR(100) DEFAULT 'user'
);
```

**Purpose**: Stores user accounts and authentication information
**Key Fields**:

- `userid`: Primary key, auto-increment
- `username`: User's display name
- `email`: Unique email address for login
- `password`: Hashed password
- `role`: User role ('user', 'teacher', 'admin')

### 2. `questions` - Problem Repository

```sql
CREATE TABLE questions (
    q_id INT PRIMARY KEY AUTO_INCREMENT,
    qname VARCHAR(500),
    description TEXT,
    defcode TEXT,
    checkBy VARCHAR(100),
    funcname VARCHAR(100),
    solution TEXT,
    qtype VARCHAR(200),
    timer INT DEFAULT 0,
    selected_languages TEXT,
    language_templates TEXT,
    language_solutions TEXT,
    FULLTEXT(qname, description)
);
```

**Purpose**: Stores coding problems and challenges
**Key Fields**:

- `q_id`: Primary key, auto-increment
- `qname`: Problem title
- `description`: Problem description
- `defcode`: Default starter code
- `checkBy`: Validation method ('testcase', 'ai')
- `funcname`: Expected function name
- `solution`: Reference solution
- `qtype`: Problem category/type
- `timer`: Time limit in minutes
- `selected_languages`: JSON array of supported languages
- `language_templates`: JSON object with language-specific templates
- `language_solutions`: JSON object with language-specific solutions

### 3. `testcases` - Test Case Management

```sql
CREATE TABLE testcases (
    t_id INT PRIMARY KEY AUTO_INCREMENT,
    tno INT,
    q_id INT,
    runnercode TEXT,
    ip VARCHAR(100),
    iptype VARCHAR(100),
    op VARCHAR(100),
    optype VARCHAR(100),
    language VARCHAR(50) DEFAULT 'c',
    FOREIGN KEY (q_id) REFERENCES questions(q_id) ON DELETE CASCADE,
    INDEX idx_qid_lang (q_id, language)
);
```

**Purpose**: Stores test cases for problem validation
**Key Fields**:

- `t_id`: Primary key, auto-increment
- `tno`: Test case number
- `q_id`: Foreign key to questions table
- `runnercode`: Code to run with user's solution
- `ip`: Input data
- `iptype`: Input data type
- `op`: Expected output
- `optype`: Output data type
- `language`: Programming language for this test case

### 4. `solved` - Problem Completion Tracking

```sql
CREATE TABLE solved (
    sol_id INT PRIMARY KEY AUTO_INCREMENT,
    q_id INT,
    user_id INT,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (q_id) REFERENCES questions(q_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    UNIQUE KEY unique_solve (q_id, user_id)
);
```

**Purpose**: Tracks which problems each user has solved
**Key Fields**:

- `sol_id`: Primary key, auto-increment
- `q_id`: Foreign key to questions table
- `user_id`: Foreign key to users table
- `solved_at`: Timestamp when problem was solved
- **Unique Constraint**: Prevents duplicate solve records

## Proctoring System Tables

### 5. `proctoring_events` - Suspicious Activity Logging

```sql
CREATE TABLE proctoring_events (
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
```

**Purpose**: Logs suspicious activities during problem solving
**Key Fields**:

- `event_id`: Primary key, auto-increment
- `user_id`: User who triggered the event
- `q_id`: Problem being worked on
- `event_type`: Type of suspicious activity
- `event_details`: Additional context about the event
- `severity`: Event severity ('low', 'medium', 'high')

### 6. `active_sessions` - Live Session Tracking

```sql
CREATE TABLE active_sessions (
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
```

**Purpose**: Tracks active coding sessions for proctoring
**Key Fields**:

- `session_id`: Primary key, auto-increment
- `user_id`: User in the session
- `username`: Cached username for performance
- `q_id`: Problem being worked on
- `problem_name`: Cached problem name
- `language`: Programming language being used
- `started_at`: Session start time
- `last_activity`: Last activity timestamp
- `is_active`: Whether session is currently active
- `tab_switches`: Number of tab switches detected
- `copy_paste_count`: Number of copy/paste operations

### 7. `code_submissions` - Code Storage for Plagiarism Detection

```sql
CREATE TABLE code_submissions (
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
```

**Purpose**: Stores submitted code for similarity analysis
**Key Fields**:

- `submission_id`: Primary key, auto-increment
- `user_id`: User who submitted the code
- `q_id`: Problem the code solves
- `code`: The actual code submission
- `language`: Programming language used
- `submitted_at`: Submission timestamp
- `is_plagiarized`: Plagiarism detection flag
- `similarity_score`: Similarity score with other submissions

### 8. `proctoring_settings` - Configurable Proctoring Rules

```sql
CREATE TABLE proctoring_settings (
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
```

**Purpose**: Configurable proctoring rules per problem
**Key Fields**:

- `setting_id`: Primary key, auto-increment
- `q_id`: Problem-specific settings (NULL for global)
- `enable_proctoring`: Whether proctoring is enabled
- `max_tab_switches`: Maximum allowed tab switches
- `max_copy_paste`: Maximum allowed copy/paste operations
- `disable_devtools`: Whether to disable developer tools
- `track_similarity`: Whether to track code similarity
- `similarity_threshold`: Threshold for similarity detection

## Database Relationships

### Primary Relationships

1. **users** → **solved** (1:many) - One user can solve many problems
2. **questions** → **solved** (1:many) - One problem can be solved by many users
3. **questions** → **testcases** (1:many) - One problem has many test cases
4. **users** → **proctoring_events** (1:many) - One user can trigger many events
5. **questions** → **proctoring_events** (1:many) - One problem can have many events
6. **users** → **active_sessions** (1:many) - One user can have multiple sessions
7. **questions** → **active_sessions** (1:many) - One problem can have multiple active sessions
8. **users** → **code_submissions** (1:many) - One user can make many submissions
9. **questions** → **code_submissions** (1:many) - One problem can have many submissions

### Indexes for Performance

- `idx_qid_lang` on testcases (q_id, language)
- `idx_user_id` on proctoring_events, active_sessions
- `idx_q_id` on proctoring_events, code_submissions
- `idx_timestamp` on proctoring_events
- `idx_is_active` on active_sessions
- `idx_last_activity` on active_sessions
- `unique_solve` on solved (q_id, user_id) - Prevents duplicate solve records

## Data Types and Constraints

### Key Constraints

- **Primary Keys**: All tables have auto-increment primary keys
- **Foreign Keys**: Proper referential integrity with CASCADE deletes
- **Unique Constraints**:
  - `users.email` - Unique email addresses
  - `solved(q_id, user_id)` - Unique solve records
- **Default Values**: Sensible defaults for timestamps, counters, and flags

### JSON Fields

- `questions.selected_languages` - Array of supported languages
- `questions.language_templates` - Language-specific code templates
- `questions.language_solutions` - Language-specific solutions

## Migration History

1. **Initial Schema**: Core tables (users, questions, testcases, solved)
2. **Multi-language Support**: Added language fields to questions and testcases
3. **Proctoring System**: Added proctoring tables and settings
4. **Duplicate Prevention**: Added unique constraints to solved table

## Performance Considerations

- Full-text search on questions (qname, description)
- Indexed foreign keys for fast joins
- Composite indexes for common query patterns
- Automatic cleanup of stale sessions
- Batch processing for proctoring events

This schema supports a comprehensive coding platform with user management, problem solving, test case validation, and advanced proctoring capabilities.
