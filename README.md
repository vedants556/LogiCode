# LogiCode

LogiCode is a comprehensive online coding platform designed to help students practice data structure and algorithm problems with real-time feedback, AI-powered assistance, and academic integrity monitoring. The platform provides a LeetCode-style coding environment with advanced proctoring features for educational institutions.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [Multi-Language Support](#multi-language-support)
- [Proctoring System](#proctoring-system)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Recent Updates](#recent-updates)
- [Contributing](#contributing)

## Features

### Core Features

- **Multi-Language Code Editor**: Support for C, C++, Python, and Java with Monaco Editor integration
- **LeetCode-Style Testing**: Run and test code with multiple test cases before submission
- **Real-Time Code Execution**: Powered by Piston API for secure code execution
- **AI Assistance**: Google Gemini integration for intelligent hints without revealing solutions
- **Timer-Based Challenges**: Auto-submit functionality when time expires
- **Progress Tracking**: Monitor problem-solving statistics and performance metrics
- **Modern Leaderboard**: Competitive rankings with podium display for top performers

### Admin Features

- **Question Management**: Add and manage coding problems with multi-language support
- **Test Case Validation**: Validate test cases before saving to ensure correctness
- **Dynamic Language Support**: Configure problems for specific programming languages
- **Test Case Templates**: Separate solution code and driver code for each language

### Proctoring System (Teacher Role)

- **Real-Time Monitoring**: Live dashboard showing active coding sessions
- **Code Plagiarism Detection**: Automatic similarity checking using Levenshtein distance algorithm
- **Activity Tracking**:
  - Tab switching detection
  - Copy/paste monitoring
  - DevTools access prevention
  - Session duration tracking
- **Event Logging**: Comprehensive logs with severity levels (Low, Medium, High)
- **Student Analytics**: Detailed profiles with activity metrics and violation history
- **Configurable Settings**: Customizable thresholds for violations and similarity detection

### Security Features

- **Role-Based Access Control**: User, Admin, and Teacher roles
- **JWT Authentication**: Secure API endpoints
- **Proctoring Enforcement**:
  - Right-click prevention
  - DevTools blocking (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
  - Tab switching detection
  - Copy/paste tracking

## Technologies Used

### Frontend

- **React.js** - Interactive user interfaces
- **Monaco Editor** - Professional code editor (VS Code's editor)
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **React Icons** - UI icons
- **Lucide React** - Additional icon set
- **Vite** - Fast build tool and development server

### Backend

- **Node.js** - Server-side runtime
- **Express.js** - Web application framework
- **MySQL2** - Database driver
- **Socket.IO** - WebSocket server
- **JWT** - JSON Web Tokens for authentication
- **Google Generative AI** - AI-powered hints via Gemini API
- **Piston API** - Secure code execution engine

### Development Tools

- **Nodemon** - Auto-reload during development
- **ESLint** - Code linting
- **dotenv** - Environment variable management

## Architecture

The system follows a client-server architecture with real-time capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React)                          │
│  ┌──────────────┬──────────────┬────────────────────────┐   │
│  │   Monaco     │   Socket.IO  │   React Router         │   │
│  │   Editor     │   Client     │   Components           │   │
│  └──────────────┴──────────────┴────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────▼────────────────────────────────────┐
│               Server (Node.js + Express)                     │
│  ┌──────────────┬──────────────┬────────────────────────┐   │
│  │   REST API   │   Socket.IO  │   JWT Auth             │   │
│  │   Endpoints  │   Server     │   Middleware           │   │
│  └──────────────┴──────────────┴────────────────────────┘   │
└─────┬──────────────────────┬─────────────────────┬──────────┘
      │                      │                     │
      ▼                      ▼                     ▼
┌──────────┐        ┌──────────────┐      ┌──────────────┐
│  MySQL   │        │  Piston API  │      │  Gemini AI   │
│ Database │        │ (Code Exec)  │      │  (Hints)     │
└──────────┘        └──────────────┘      └──────────────┘
```

### Key Components:

- **Frontend**: React SPA with Monaco editor for code editing
- **Backend**: Express server handling API requests and WebSocket connections
- **Database**: MySQL for persistent storage of users, problems, test cases, and proctoring data
- **Code Execution**: Piston API for secure, sandboxed code execution
- **AI Component**: Google Gemini for intelligent hint generation

## Installation

### Prerequisites

- **Node.js** (v14 or above)
- **MySQL** (v8.0 or above)
- **Gemini API Key** (free from Google AI Studio)
- **Git** (for cloning the repository)

### Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/vedants556/logicode.git
cd logicode
```

#### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory with the following content:

```env
GEMINI_API_KEY='your-gemini-api-key-here'
SQL_PASSWORD='your-mysql-password-here'
PORT=5000
```

> **Note**: Replace `your-gemini-api-key-here` with your actual Gemini API key and `your-mysql-password-here` with your MySQL root password.

#### 3. Database Setup

See the [Database Setup](#database-setup) section below for detailed instructions.

#### 4. Run Database Migrations

Execute the migration script to set up the proctoring system:

```bash
node run_migration.js
```

This will create the following tables:

- `proctoring_events` - Stores suspicious activities
- `active_sessions` - Tracks live coding sessions
- `code_submissions` - Stores code for plagiarism detection
- `proctoring_settings` - Configurable proctoring rules

#### 5. Start the Backend Server

```bash
npm run dev
```

The backend server will start on `http://localhost:5000`

#### 6. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

#### 7. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

## Database Setup

### 1. Create Database and Tables

Execute the following SQL commands in MySQL:

```sql
-- Create database
CREATE DATABASE logicode;
USE logicode;

-- Users table
CREATE TABLE users (
    userid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) DEFAULT NULL,
    email VARCHAR(200) DEFAULT NULL UNIQUE,
    password VARCHAR(1000) DEFAULT NULL,
    role VARCHAR(100) DEFAULT 'user'
);

-- Questions table
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
    FULLTEXT(qname, description)
);

-- Test cases table
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

-- Solved problems table
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

### 2. Run Proctoring System Migration

The proctoring system tables are created automatically when you run:

```bash
cd backend
node run_migration.js
```

This creates:

- `proctoring_events`
- `active_sessions`
- `code_submissions`
- `proctoring_settings`

### 3. Create Admin/Teacher Accounts

```sql
-- Create admin account
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@logicode.com', 'admin123', 'admin');

-- Create teacher account
INSERT INTO users (username, email, password, role)
VALUES ('teacher', 'teacher@logicode.com', 'teacher123', 'teacher');

-- Promote existing user to teacher
UPDATE users SET role = 'teacher' WHERE email = 'user@example.com';
```

> **⚠️ Important**: In production, use properly hashed passwords. The above examples are for development only.

## Usage

### For Students

1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Browse Problems**: Navigate to the problem list and select a challenge
3. **Select Language**: Choose from C, C++, Python, or Java
4. **Write Code**: Use the Monaco editor to write your solution
5. **Run Tests**: Click "Run" to test against all test cases (shows all results)
6. **Submit Solution**: Click "Submit" when ready (marks problem as solved)
7. **Get AI Help**: Use "Ask AI" button for hints when stuck
8. **Check Leaderboard**: View rankings and compete with others
9. **Track Progress**: Monitor your solved problems and statistics

### For Admins

1. **Login**: Access admin panel with admin credentials
2. **Add Problems**: Create new coding challenges
3. **Configure Languages**: Select supported languages for each problem
4. **Add Test Cases**: Define test cases with validation
5. **Set Timers**: Configure time limits for problems (optional)
6. **Manage Users**: View and manage user accounts

### For Teachers

1. **Login**: Access teacher dashboard with teacher credentials
2. **Monitor Students**: View real-time active coding sessions
3. **Check Events**: Review proctoring events and violations
4. **Detect Plagiarism**: Run similarity checks on code submissions
5. **View Analytics**: Access detailed student profiles and statistics
6. **Configure Settings**: Adjust proctoring thresholds and rules

Access the Teacher Dashboard at: `/teacher-dashboard`

## Multi-Language Support

LogiCode supports four programming languages with language-specific handling:

### Supported Languages

| Language | Version | Piston Runtime | File Extension |
| -------- | ------- | -------------- | -------------- |
| C        | 10.2.0  | gcc            | .c             |
| C++      | 10.2.0  | g++            | .cpp           |
| Python   | 3.10.0  | python3        | .py            |
| Java     | 15.0.2  | java           | .java          |

### Features

- **Language-Specific Test Cases**: Test cases are filtered by language
- **Separate Solution Code**: Each language has its own solution template
- **Default Templates**: Pre-configured starter code for each language
- **Syntax Highlighting**: Monaco editor provides language-specific highlighting
- **Auto-completion**: IntelliSense support for all languages

### Code Execution Flow

1. User selects language from dropdown
2. Writes solution in Monaco editor
3. Code is sent to backend with language identifier
4. Backend combines solution with test runner code
5. Piston API executes code in sandboxed environment
6. Results are returned with performance metrics

## Proctoring System

### Overview

The proctoring system provides comprehensive monitoring for academic integrity:

### Features

#### 1. **Tab Switching Detection**

- Monitors when students leave the problem page
- Logs visibility changes with timestamps
- Severity: Medium

#### 2. **Copy/Paste Tracking**

- Detects paste operations in the code editor
- Tracks paste size and content length
- High severity for large pastes (>100 characters)

#### 3. **DevTools Prevention**

- Blocks right-click context menu
- Prevents F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
- Logs all access attempts
- Severity: High

#### 4. **Code Plagiarism Detection**

- Stores all code submissions with timestamps
- Uses Levenshtein distance algorithm for similarity
- Normalizes code (removes whitespace, comments)
- Configurable threshold (default: 85%)
- Flags suspicious pairs automatically

#### 5. **Real-Time Session Tracking**

- Tracks active problem-solving sessions
- Records start/end times
- Counts violations per session
- Shows live activity status

### Teacher Dashboard

Teachers have access to a comprehensive dashboard with four tabs:

#### 📊 Overview Tab

- Total student count
- Currently active users
- High severity event count
- Live session feed with details

#### 👥 Students Tab

- Complete student list with metrics
- Problems solved count
- Total violations
- Individual student profiles
- Session history

#### 📋 Events Tab

- All proctoring events log
- Filterable by severity, user, problem
- Color-coded by severity (🟢 Low, 🟠 Medium, 🔴 High)
- Timestamped entries

#### 🔍 Plagiarism Tab

- Enter problem ID to check similarity
- See all suspicious pairs
- Similarity percentage displayed
- Side-by-side code comparison

### Proctoring Settings

Default configuration (can be customized):

```sql
-- View current settings
SELECT * FROM proctoring_settings WHERE q_id IS NULL;

-- Update global settings
UPDATE proctoring_settings
SET max_tab_switches = 10,
    max_copy_paste = 5,
    similarity_threshold = 0.90,
    enable_proctoring = TRUE
WHERE q_id IS NULL;

-- Set per-problem settings
INSERT INTO proctoring_settings (q_id, max_tab_switches, similarity_threshold)
VALUES (1, 3, 0.95);
```

### Event Severity Levels

- **Low (🟢)**: Window blur, small copy operations, right-click attempts
- **Medium (🟠)**: Tab switches, medium paste operations, focus changes
- **High (🔴)**: DevTools access, large pastes (>100 chars), repeated violations

## API Documentation

### Authentication Endpoints

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| POST   | `/api/signup` | Register new user   |
| POST   | `/api/login`  | User authentication |
| GET    | `/api/verify` | Verify JWT token    |

### Question Endpoints

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| POST   | `/api/addquestion`      | Add new problem (Admin) |
| GET    | `/api/getquestions`     | Get all problems        |
| GET    | `/api/getquestion/:qid` | Get specific problem    |
| GET    | `/api/solved/:userid`   | Get solved problems     |

### Code Execution Endpoints

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| POST   | `/api/runtestcases` | Run code with all test cases |
| POST   | `/api/checktc`      | Submit and validate solution |
| POST   | `/api/checkbyai`    | AI-based validation          |
| POST   | `/api/tcvalid`      | Validate test case           |

### Proctoring Endpoints (Student)

| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| POST   | `/api/proctoring/log-event`   | Log proctoring event     |
| POST   | `/api/proctoring/session`     | Start/update session     |
| POST   | `/api/proctoring/end-session` | End active session       |
| POST   | `/api/proctoring/submit-code` | Submit code for tracking |

### Teacher Endpoints (Teacher/Admin Only)

| Method | Endpoint                         | Description                 |
| ------ | -------------------------------- | --------------------------- |
| GET    | `/api/teacher/active-sessions`   | Get all active sessions     |
| GET    | `/api/teacher/proctoring-events` | Get all events (filterable) |
| GET    | `/api/teacher/users-overview`    | Get all students with stats |
| GET    | `/api/teacher/user/:userid`      | Get detailed user info      |
| POST   | `/api/teacher/check-similarity`  | Check code similarity       |

### Leaderboard Endpoint

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/leaderboard` | Get user rankings |

## Screenshots

### Landing Page

![Landing Page](/screenshots/Screenshot%20(1274).png)
![Landing Page](/screenshots/Screenshot%20(1275).png)
![Landing Page](/screenshots/Screenshot%20(1276).png)
![Landing Page](/screenshots/Screenshot%20(1277).png)
![Landing Page](/screenshots/Screenshot%20(1278).png)
![Landing Page](/screenshots/Screenshot%20(1279).png)



### Dashboard

![Dashboard](/screenshots/Screenshot%20(1283).png)
![Dashboard](/screenshots/Screenshot%20(1284).png)
![Dashboard](/screenshots/Screenshot%20(1285).png)

### Problem Selection

![Select Problem](/screenshots/Screenshot%20(1285).png)

### Code Editor

![Solve Problem](/screenshots/Screenshot%20(1288).png)
![Solve Problem](/screenshots/Screenshot%20(1289).png)
![Solve Problem](/screenshots/Screenshot%20(1290).png)
![Solve Problem](/screenshots/Screenshot%20(1291).png)
![Solve Problem](/screenshots/Screenshot%20(1292).png)
![Solve Problem](/screenshots/Screenshot%20(1293).png)
![Solve Problem](/screenshots/Screenshot%20(1294).png)
![Solve Problem](/screenshots/Screenshot%20(1295).png)
![Solve Problem](/screenshots/Screenshot%20(1296).png)
![Solve Problem](/screenshots/Screenshot%20(1297).png)
![Solve Problem](/screenshots/Screenshot%20(1298).png)
![Solve Problem](/screenshots/Screenshot%20(1299).png)
![Solve Problem](/screenshots/Screenshot%20(1300).png)
![Solve Problem](/screenshots/Screenshot%20(1301).png)
![Solve Problem](/screenshots/Screenshot%20(1302).png)

### Test Results

![Wrong Code Submitted]()

### AI Assistant

![Ask AI for Help]()

### Admin Panel

![Admin Panel]()

### Leaderboard

![Leaderboard]()

### Login/Signup

![Login/Signup]()

## Recent Updates

### Version 2.0 - Major Feature Release

#### 🎓 Proctoring System

- Complete teacher dashboard with real-time monitoring
- Code plagiarism detection using Levenshtein algorithm
- Activity tracking (tab switches, copy/paste, DevTools)
- Event logging with severity levels
- Configurable settings and thresholds

#### 🌐 Multi-Language Support

- Added C++, Python, and Java support
- Language-specific test case filtering
- Separate solution templates per language
- Dynamic language configuration

#### ⚡ Enhanced Code Execution

- LeetCode-style Run button (shows all test results)
- Improved Submit button (validates and marks as solved)
- Better error messages (compilation vs runtime errors)
- Language-specific code combination logic

#### ⏱️ Timer System

- Auto-submit functionality when time expires
- Visual warnings at 1-minute mark
- Configurable time limits per problem
- Prevents working beyond allocated time

#### 🏆 Modern Leaderboard

- Redesigned with glassmorphism effects
- Podium display for top 3 performers
- "Your Current Rank" highlight
- Responsive design for all devices

#### 🔧 Bug Fixes

- Fixed test case validation issues
- Resolved Python indentation errors
- Fixed language filtering for test cases
- Improved error handling throughout

### Documentation Files

- `PROCTORING_SUMMARY.md` - Complete proctoring system documentation
- `LEADERBOARD_UPDATE.md` - Leaderboard redesign details
- `TIMER_AUTO_SUBMIT_FEATURE.md` - Timer functionality guide
- `TEST_CASE_LANGUAGE_FIX.md` - Language filtering fix
- `RUN_BUTTON_FIX.md` - LeetCode-style testing implementation
- `FIXES_SUMMARY.md` - Comprehensive fix summary
- `CRITICAL_FIXES.md` - Critical bug fixes
- `QUICK_REFERENCE.md` - Quick reference guide

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting PR
- Keep commits atomic and well-described

## License

This project is licensed under the ISC License.

## Authors

- **Vedant Shelar** - Backend Development
- **Rahul Shelke** - Frontend Development
- **Ayush Devre** - Database Design
- **Anuj Koli** - Integration & Testing

## Acknowledgments

- **Piston API** - For secure code execution
- **Google Gemini** - For AI-powered hints
- **Monaco Editor** - For the professional code editor
- **React Community** - For excellent documentation and tools

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Contact the development team
- Check documentation files in the repository

---

**Built with ❤️ for students learning data structures and algorithms**
