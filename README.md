# LogiCode

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-61DAFB.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0-4479A1.svg)

LogiCode is a comprehensive online coding platform designed to help students practice data structure and algorithm problems with real-time feedback, AI-powered assistance, and academic integrity monitoring. The platform provides a LeetCode-style coding environment with advanced proctoring features for educational institutions.

## 🌟 Highlights

- **Multi-Language Support**: C, C++, Python, and Java
- **Real-Time Proctoring**: Monitor student activity with comprehensive tracking
- **AI-Powered Hints**: Get intelligent help without solution spoilers
- **Advanced Security**: Multi-layer protection against spam and abuse
- **Performance Metrics**: LeetCode-style execution statistics
- **Modern UI**: Clean, responsive design with glassmorphism effects

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [Multi-Language Support](#multi-language-support)
- [Proctoring System](#proctoring-system)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [Documentation](#documentation)
- [Screenshots](#screenshots)
- [Recent Updates](#recent-updates)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

### 🚀 Core Features

- **Multi-Language Code Editor**: Support for C, C++, Python, and Java with Monaco Editor integration

  - Professional VS Code-style editor with syntax highlighting
  - IntelliSense and auto-completion for all languages
  - Customizable themes and settings

- **LeetCode-Style Testing**: Run and test code with multiple test cases before submission

  - Run button: Test against all test cases with detailed feedback
  - Submit button: Validate solution and mark as solved
  - Real-time performance metrics (CPU time, memory usage)

- **Real-Time Code Execution**: Powered by Piston API for secure code execution

  - Sandboxed execution environment
  - Support for stdin/stdout
  - Detailed error messages (compilation vs runtime)

- **AI Assistance**: Google Gemini integration for intelligent hints without revealing solutions

  - Context-aware hints based on problem description
  - Progressive hint system
  - Never reveals complete solutions

- **Timer-Based Challenges**: Auto-submit functionality when time expires

  - Configurable time limits per problem
  - Visual countdown with warnings
  - Automatic submission when time runs out

- **Progress Tracking**: Monitor problem-solving statistics and performance metrics

  - Solved problems count
  - Success rate tracking
  - Historical performance data

- **Modern Leaderboard**: Competitive rankings with podium display for top performers
  - Glassmorphism design
  - Real-time ranking updates
  - Highlight your current position

### 👨‍💼 Admin Features

- **Question Management**: Add and manage coding problems with multi-language support

  - Rich text editor for problem descriptions
  - Support for images and formatted text
  - Difficulty levels and categorization

- **Test Case Validation**: Validate test cases before saving to ensure correctness

  - Live test case validation
  - Separate solution and driver code
  - Expected vs actual output comparison

- **Dynamic Language Support**: Configure problems for specific programming languages

  - Enable/disable languages per problem
  - Language-specific default code
  - Custom test cases per language

- **User Management**: View and manage user accounts
  - Promote users to admin/teacher roles
  - View user statistics and progress
  - Manage permissions

### 🎓 Proctoring System (Teacher Role)

- **Real-Time Monitoring**: Live dashboard showing active coding sessions

  - See who's coding right now
  - Current problem being solved
  - Session duration and activity
  - Real-time event stream

- **Code Plagiarism Detection**: Automatic similarity checking using Levenshtein distance algorithm

  - Configurable similarity threshold (default: 85%)
  - Code normalization (removes whitespace, comments)
  - Side-by-side code comparison
  - Batch checking for all submissions

- **Activity Tracking**: Comprehensive monitoring of student behavior

  - Tab switching detection (Medium severity)
  - Copy/paste monitoring (High severity for large pastes >100 chars)
  - DevTools access prevention (High severity)
  - Session duration tracking
  - Right-click attempt logging (Low severity)

- **Event Logging**: Comprehensive logs with severity levels

  - 🟢 Low: Window blur, small copy operations, right-click attempts
  - 🟠 Medium: Tab switches, medium paste operations
  - 🔴 High: DevTools access, large pastes, repeated violations

- **Student Analytics**: Detailed profiles with activity metrics

  - Individual student profiles
  - Problems solved count
  - Total violations by severity
  - Session history with timestamps
  - Violation trends and patterns

- **Configurable Settings**: Customizable thresholds and rules
  - Max tab switches allowed
  - Max copy/paste operations
  - Similarity detection threshold
  - Enable/disable proctoring per problem
  - Global and per-problem settings

### Security Features

- **Role-Based Access Control**: User, Admin, and Teacher roles
- **JWT Authentication**: Secure API endpoints
- **Proctoring Enforcement**:
  - Right-click prevention
  - DevTools blocking (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
  - Tab switching detection
  - Copy/paste tracking
- **Advanced Security Measures**:
  - Multi-layer rate limiting (strict, standard, and progressive)
  - Event batching to prevent database spam
  - Automatic suspicious activity detection and blocking
  - Request validation and payload size limits
  - Frontend throttling and deduplication
  - Automated database cleanup jobs

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

## System Requirements

### Minimum Requirements

- **Node.js**: v14.0.0 or higher
- **MySQL**: v8.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 500MB free space
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Required API Keys

- **Gemini API Key**: Free from [Google AI Studio](https://makersuite.google.com/app/apikey)
- No other paid services required for basic functionality

### Supported Platforms

- **Operating Systems**: Windows, macOS, Linux
- **Cloud Platforms**: Railway, Render, Vercel, DigitalOcean, AWS, Azure
- **Databases**: MySQL 8.0+ (PostgreSQL support with modifications)

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

> 📚 **For more details**, see [Proctoring System Documentation](#proctoring-documentation)

## Security Features

### Overview

LogiCode implements comprehensive security measures to protect against spam, abuse, and system attacks. The security system uses a multi-layer approach with frontend and backend protection.

### Key Security Components

#### 1. **Rate Limiting**

- **Strict Rate Limiter** (10 requests/min): Code execution endpoints to prevent API abuse
- **Proctoring Rate Limiter** (30 requests/min): Proctoring event logging
- **Standard Rate Limiter** (100 requests/min): General API operations
- **Speed Limiter**: Progressive delay after 5 requests to discourage spam

#### 2. **Frontend Throttling**

- Event-specific rate limits (e.g., 10 right-clicks/min, 15 tab switches/min)
- Event deduplication within 1-second windows
- Prevents spam at the source before hitting the backend

#### 3. **Event Batching**

- Batches proctoring events every 5 seconds
- Reduces database writes by 90-95%
- Bulk inserts instead of individual queries

#### 4. **Request Validation**

- Maximum payload size: 1MB
- Maximum code size: 100KB
- Suspicious pattern detection (infinite loops, OS commands)
- Early rejection of malicious requests

#### 5. **Suspicious Activity Detection**

- Tracks violations per user in 5-minute windows
- Auto-blocks users after 20 violations
- Real-time monitoring and alerts for teachers

#### 6. **Database Cleanup**

- Automated cleanup scripts for old events
- Retention policies: 7 days (low severity), 30 days (all events), 90 days (code submissions)
- Table optimization to prevent bloat

### Performance Impact

**Security measures reduce:**

- API calls by 90-95%
- Database writes by 95%
- WebSocket traffic by 70%+

**Without affecting legitimate users:**

- Progressive rate limiting maintains user experience
- Automatic retry logic for transient failures
- User-friendly error messages with clear actions

> 📚 **For complete security documentation**, see [Security Measures](#security-documentation)

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

## Documentation

LogiCode includes comprehensive documentation covering all aspects of the platform. Below are all available guides organized by category:

### 🚀 Getting Started

- **[Quick Reference Guide](./QUICK_REFERENCE.md)** - Quick reference card for test case validation and common workflows
- **[Proctoring Quick Start](./PROCTORING_QUICK_START.md)** - 3-step guide to set up the proctoring system
- **[Setup Proctoring](./SETUP_PROCTORING.md)** - Detailed proctoring system setup instructions

### 🎓 Proctoring Documentation

- **[Proctoring Summary](./PROCTORING_SUMMARY.md)** - Complete overview of the proctoring system with all features
- **[Proctoring System](./PROCTORING_SYSTEM.md)** - Detailed technical documentation of proctoring features
- **[Manual Fix Instructions](./backend/MANUAL_FIX_INSTRUCTIONS.md)** - Database fixes for duplicate records

### 🔒 Security Documentation

- **[Security Measures](./SECURITY_MEASURES.md)** - Comprehensive guide to all security implementations (rate limiting, throttling, batching)
- **[Security Implementation Summary](./SECURITY_IMPLEMENTATION_SUMMARY.md)** - Summary of security features and their impact
- **[Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)** - Quick reference for security configurations
- **[Security Visual Summary](./SECURITY_VISUAL_SUMMARY.md)** - Visual guide to security architecture

### 🐛 Error Handling & Troubleshooting

- **[Error Handling](./ERROR_HANDLING.md)** - Complete error handling documentation with retry logic and user experience
- **[Error Handling Summary](./ERROR_HANDLING_SUMMARY.md)** - Quick summary of error handling strategies
- **[Critical Fixes](./CRITICAL_FIXES.md)** - Important bug fixes and their solutions
- **[Fixes Summary](./FIXES_SUMMARY.md)** - Comprehensive summary of all fixes implemented

### ⚡ Performance & Code Execution

- **[Performance Metrics Implementation](./PERFORMANCE_METRICS_IMPLEMENTATION.md)** - Guide to displaying LeetCode-style performance metrics
- **[Performance Metrics Code](./PERFORMANCE_METRICS_CODE.md)** - Code examples for performance tracking
- **[Piston Performance Analysis](./PISTON_PERFORMANCE_ANALYSIS.md)** - Analysis of Piston API performance
- **[Piston Documentation](./piston_docs.md)** - Piston API integration documentation

### ✨ Feature Updates

- **[Run Button Fix](./RUN_BUTTON_FIX.md)** - LeetCode-style run button implementation
- **[Test Case Language Fix](./TEST_CASE_LANGUAGE_FIX.md)** - Multi-language test case filtering fix
- **[Test Examples Corrected](./test_examples_corrected.md)** - Corrected test case examples for all languages
- **[Timer Auto-Submit Feature](./TIMER_AUTO_SUBMIT_FEATURE.md)** - Auto-submit functionality when timer expires
- **[Leaderboard Update](./LEADERBOARD_UPDATE.md)** - Modern leaderboard redesign documentation
- **[Landing Page Update](./LANDING_PAGE_UPDATE.md)** - Landing page design and features
- **[Solved Count Fix](./SOLVED_COUNT_FIX.md)** - Fix for duplicate solved problem records

### 🚀 Deployment

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment guide for Railway, Render, Vercel, and DigitalOcean

### 📊 Quick Navigation by Task

**Setting up the platform:**

1. Follow [Installation](#installation) section above
2. Set up database using [Database Setup](#database-setup)
3. Run proctoring migration: [Proctoring Quick Start](./PROCTORING_QUICK_START.md)

**Deploying to production:**

1. Read [Deployment Guide](./DEPLOYMENT.md)
2. Review [Security Measures](./SECURITY_MEASURES.md)
3. Set up cleanup jobs from [Security Measures](./SECURITY_MEASURES.md#6-database-cleanup)

**Adding new problems:**

1. Use admin panel
2. Follow [Test Examples Corrected](./test_examples_corrected.md)
3. Reference [Quick Reference Guide](./QUICK_REFERENCE.md)

**Monitoring students:**

1. Create teacher account
2. Access teacher dashboard
3. Read [Proctoring Summary](./PROCTORING_SUMMARY.md)

**Troubleshooting issues:**

1. Check [Error Handling](./ERROR_HANDLING.md)
2. Review [Fixes Summary](./FIXES_SUMMARY.md)
3. Consult [Critical Fixes](./CRITICAL_FIXES.md)

**Understanding security:**

1. Read [Security Measures](./SECURITY_MEASURES.md)
2. Quick reference: [Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)
3. Visual guide: [Security Visual Summary](./SECURITY_VISUAL_SUMMARY.md)

## Screenshots

### Landing Page

![Landing Page](</screenshots/Screenshot%20(1274).png>)
![Landing Page](</screenshots/Screenshot%20(1275).png>)
![Landing Page](</screenshots/Screenshot%20(1276).png>)
![Landing Page](</screenshots/Screenshot%20(1277).png>)
![Landing Page](</screenshots/Screenshot%20(1278).png>)
![Landing Page](</screenshots/Screenshot%20(1279).png>)

### Dashboard

![Dashboard](</screenshots/Screenshot%20(1283).png>)
![Dashboard](</screenshots/Screenshot%20(1284).png>)
![Dashboard](</screenshots/Screenshot%20(1285).png>)

### Problem Selection

![Select Problem](</screenshots/Screenshot%20(1285).png>)

### Code Editor

![Solve Problem](</screenshots/Screenshot%20(1288).png>)
![Solve Problem](</screenshots/Screenshot%20(1289).png>)
![Solve Problem](</screenshots/Screenshot%20(1290).png>)
![Solve Problem](</screenshots/Screenshot%20(1291).png>)
![Solve Problem](</screenshots/Screenshot%20(1292).png>)
![Solve Problem](</screenshots/Screenshot%20(1293).png>)
![Solve Problem](</screenshots/Screenshot%20(1294).png>)
![Solve Problem](</screenshots/Screenshot%20(1295).png>)
![Solve Problem](</screenshots/Screenshot%20(1296).png>)
![Solve Problem](</screenshots/Screenshot%20(1297).png>)
![Solve Problem](</screenshots/Screenshot%20(1298).png>)
![Solve Problem](</screenshots/Screenshot%20(1299).png>)
![Solve Problem](</screenshots/Screenshot%20(1300).png>)
![Solve Problem](</screenshots/Screenshot%20(1301).png>)
![Solve Problem](</screenshots/Screenshot%20(1302).png>)

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

### Version 2.5 - Security & Performance Update

#### 🔒 Advanced Security System

- **Multi-Layer Rate Limiting**: Strict (10/min), standard (100/min), and progressive rate limiters
- **Frontend Throttling**: Event-specific limits with deduplication
- **Event Batching**: 90-95% reduction in database writes
- **Auto-Blocking**: Automatic detection and blocking of malicious users
- **Request Validation**: Payload size limits and suspicious pattern detection
- **Database Cleanup**: Automated retention policies and table optimization

#### 🚨 Error Handling & Resilience

- **Comprehensive Error Handling**: User-friendly messages across all scenarios
- **Automatic Retry Logic**: Exponential backoff for transient failures
- **Graceful Degradation**: System continues working during partial failures
- **Network Error Queue**: Failed requests queued and retried when connection restored
- **Detailed Error Logging**: Complete error tracking for debugging

#### 📊 Performance Metrics

- **LeetCode-Style Metrics**: CPU time, memory usage, and execution time
- **Performance Comparison**: Compare your solution with others
- **Real-Time Statistics**: Live performance data during code execution
- **Historical Tracking**: Track performance improvements over time

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
- Fixed duplicate solved problem records
- Improved session management

### Performance Improvements

**Security Optimizations:**

- 95% reduction in API calls (frontend throttling)
- 95% reduction in database writes (event batching)
- 70%+ reduction in WebSocket traffic
- 96% reduction in database write time

**System Reliability:**

- Automatic retry for failed requests
- Progressive rate limiting (no hard blocks)
- Graceful degradation during high load
- Zero impact on legitimate users

### All Documentation

See the [Documentation](#documentation) section for links to all guides including:

- Security measures and best practices
- Proctoring system setup and usage
- Error handling strategies
- Performance optimization guides
- Deployment instructions
- Troubleshooting and fixes

## Deployment

LogiCode can be deployed to various hosting platforms. For detailed deployment instructions, see the **[Deployment Guide](./DEPLOYMENT.md)**.

### Quick Deployment Options

#### Railway (Recommended - Easiest)

1. Sign up at [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add MySQL database
4. Set environment variables
5. Deploy automatically

#### Render

1. Sign up at [Render.com](https://render.com)
2. Create new Web Service
3. Configure build settings
4. Add MySQL database
5. Deploy

#### Vercel + PlanetScale

- Frontend on Vercel
- Backend on Railway/Render
- Database on PlanetScale

#### DigitalOcean App Platform

- Full-stack deployment
- Managed MySQL database
- Custom domain support

### Required Environment Variables

```env
GEMINI_API_KEY=your-gemini-api-key
SQL_PASSWORD=your-mysql-password
JWT_SECRET=your-jwt-secret
DB_HOST=your-database-host
DB_USER=your-database-user
DB_NAME=your-database-name
DB_PORT=3306
NODE_ENV=production
```

### Post-Deployment Checklist

- [ ] Test all features (login, code execution, proctoring)
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring and logging
- [ ] Set up automated database cleanup (cron job)
- [ ] Enable HTTPS
- [ ] Configure CORS settings
- [ ] Test proctoring system
- [ ] Create admin and teacher accounts

> 📚 **For complete deployment instructions**, see [Deployment Guide](./DEPLOYMENT.md)

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

### Getting Help

For issues, questions, or suggestions:

1. **Documentation**: Check the [Documentation](#documentation) section for comprehensive guides
2. **GitHub Issues**: [Open an issue](https://github.com/vedants556/logicode/issues) for bugs or feature requests
3. **Email**: Contact the development team
4. **Quick References**:
   - [Quick Reference Guide](./QUICK_REFERENCE.md) - Common workflows
   - [Error Handling](./ERROR_HANDLING.md) - Troubleshooting guide
   - [Security Measures](./SECURITY_MEASURES.md) - Security configuration

### Common Issues

| Issue                        | Solution                                          | Documentation                                         |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| Installation problems        | Check [Installation](#installation) section       | README.md                                             |
| Database setup issues        | Follow [Database Setup](#database-setup)          | README.md                                             |
| Proctoring not working       | Run migration script                              | [Proctoring Quick Start](./PROCTORING_QUICK_START.md) |
| Rate limit errors            | Check [Security Measures](./SECURITY_MEASURES.md) | Security docs                                         |
| Deployment issues            | Follow platform-specific guide                    | [Deployment Guide](./DEPLOYMENT.md)                   |
| Test case validation failing | Check examples                                    | [Test Examples](./test_examples_corrected.md)         |

### Contributing

We welcome contributions! See the [Contributing](#contributing) section above for guidelines.

### Stay Updated

- ⭐ Star the repository to show your support
- 👀 Watch the repository for updates
- 🔔 Subscribe to releases for new features

---

## Project Statistics

- **Languages**: 4 supported (C, C++, Python, Java)
- **Security Layers**: 6 (Rate limiting, throttling, batching, validation, detection, cleanup)
- **Database Tables**: 9 (Users, questions, test cases, solved, proctoring tables)
- **API Endpoints**: 20+ (Authentication, questions, code execution, proctoring, teacher)
- **Documentation Files**: 28 comprehensive guides
- **Performance Improvement**: 90-95% reduction in database load
- **Active Development**: Regular updates and improvements

---

## Keywords

Online Coding Platform, LeetCode Clone, Coding Practice, Data Structures and Algorithms, Code Execution Platform, Academic Integrity, Proctoring System, Plagiarism Detection, Multi-Language Support, Educational Technology, Computer Science Education, Programming Practice, Code Editor, Real-Time Monitoring, Student Assessment, Competitive Programming, Learn to Code

---

**Built with ❤️ for students learning data structures and algorithms**

**Repository**: [github.com/vedants556/logicode](https://github.com/vedants556/logicode)
