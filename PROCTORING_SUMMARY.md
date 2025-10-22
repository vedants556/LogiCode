# Proctoring System - Implementation Summary

## What Was Added

A comprehensive proctoring system has been successfully integrated into LogiCode with the following components:

## 🎓 Teacher Role

### Capabilities

- **God-level permissions** to view all platform activities
- Access to dedicated Teacher Dashboard at `/teacher-dashboard`
- Real-time monitoring of all active users
- Cannot solve problems (view-only for problems)
- View detailed analytics and user behavior

### Features

1. **Real-time Dashboard** showing:

   - Total students
   - Currently active users
   - High severity events count
   - Live session monitoring

2. **Student Monitoring**:

   - View all students with activity metrics
   - Individual student profiles
   - Session history
   - Proctoring event logs

3. **Code Plagiarism Detection**:

   - Compare code submissions
   - Automatic similarity scoring
   - Flag suspicious pairs (>85% similarity)

4. **Event Log**:
   - All proctoring events with timestamps
   - Color-coded by severity
   - Filterable by user, problem, severity

## 🔒 Student Proctoring Features

### Tab Switching Detection

- ✅ Monitors when students leave the problem page
- ✅ Logs visibility changes
- ✅ Counts total tab switches
- ✅ Severity: Medium

### Copy/Paste Tracking

- ✅ Detects paste operations
- ✅ Tracks paste size
- ✅ Higher severity for large pastes (>100 chars)
- ✅ Severity: Medium/High based on size

### Developer Tools Prevention

- ✅ Blocks right-click context menu
- ✅ Prevents F12 (DevTools)
- ✅ Prevents Ctrl+Shift+I (DevTools)
- ✅ Prevents Ctrl+Shift+J (Console)
- ✅ Prevents Ctrl+U (View Source)
- ✅ Severity: High

### Code Similarity Detection

- ✅ Stores all code submissions
- ✅ Levenshtein distance algorithm
- ✅ Normalizes code (removes whitespace/comments)
- ✅ Configurable threshold (default 85%)

## 📁 Files Created/Modified

### Backend Files

1. **`backend/migrations/add_proctoring_system.sql`** - Database schema

   - 4 new tables
   - Indexes for performance
   - Default settings

2. **`backend/index.js`** - Modified
   - Added 10+ new API endpoints
   - Teacher middleware
   - Code similarity algorithm
   - Session tracking

### Frontend Files

3. **`frontend/src/pages/TeacherDashboard.jsx`** - NEW

   - Complete teacher dashboard UI
   - 4 tabs: Overview, Students, Events, Plagiarism
   - Real-time updates every 5 seconds
   - Detailed user profiles

4. **`frontend/src/pages/TeacherDashboard.css`** - NEW

   - Beautiful gradient design
   - Responsive layout
   - Animated components
   - Color-coded severity indicators

5. **`frontend/src/pages/Problem.jsx`** - Modified

   - Added proctoring state management
   - Tab visibility tracking
   - DevTools prevention
   - Copy/paste detection
   - Session lifecycle management

6. **`frontend/src/components/Output.jsx`** - Modified

   - Code submission tracking
   - Automatic plagiarism logging

7. **`frontend/src/components/Navbar/Navbar.jsx`** - Modified

   - Teacher role detection
   - Teacher Dashboard link (only for teachers)
   - Mobile responsive

8. **`frontend/src/App.jsx`** - Modified
   - Added `/teacher-dashboard` route
   - Imported TeacherDashboard component

### Documentation Files

9. **`PROCTORING_SYSTEM.md`** - Complete documentation
10. **`SETUP_PROCTORING.md`** - Quick setup guide
11. **`PROCTORING_SUMMARY.md`** - This file

## 🗄️ Database Schema

### New Tables Created

#### 1. `proctoring_events`

Stores all suspicious activities

- Event tracking with severity levels
- Linked to users and problems
- Timestamped for audit trail

#### 2. `active_sessions`

Tracks live problem-solving sessions

- Real-time activity monitoring
- Tab switch counters
- Copy/paste counters
- Session duration tracking

#### 3. `code_submissions`

Stores code for plagiarism detection

- All submissions saved
- Similarity scoring
- Language tracking
- Plagiarism flags

#### 4. `proctoring_settings`

Configurable proctoring rules

- Global and per-problem settings
- Customizable thresholds
- Enable/disable toggles

## 🔌 API Endpoints

### Student Endpoints (Authenticated)

- `POST /api/proctoring/log-event` - Log proctoring events
- `POST /api/proctoring/session` - Start/update session
- `POST /api/proctoring/end-session` - End session
- `POST /api/proctoring/update-counter` - Update counters
- `POST /api/proctoring/submit-code` - Submit code for tracking

### Teacher Endpoints (Teacher/Admin Only)

- `GET /api/teacher/active-sessions` - Get all active sessions
- `GET /api/teacher/proctoring-events` - Get all events (filterable)
- `GET /api/teacher/users-overview` - Get all students with stats
- `GET /api/teacher/user/:userid` - Get detailed user info
- `POST /api/teacher/check-similarity` - Check code similarity

## 🎨 UI/UX Features

### Teacher Dashboard

- **Modern gradient design** with purple/blue theme
- **Real-time updates** every 5 seconds
- **Live indicators** for active users (🔴 LIVE)
- **Color-coded severity** (🟢 Low, 🟠 Medium, 🔴 High)
- **Interactive tables** with hover effects
- **Responsive design** for all screen sizes
- **Loading states** with animated spinners

### Problem Page (Students)

- **Transparent proctoring** - works in background
- **No intrusive popups** - seamless experience
- **Automatic session tracking** - starts/ends automatically
- **DevTools prevention** - subtle blocking

## ⚙️ Configuration

Default Settings:

- Max tab switches: 5
- Max copy/paste: 10
- Similarity threshold: 85%
- Proctoring enabled: TRUE

Can be customized via database:

```sql
UPDATE proctoring_settings
SET max_tab_switches = 10,
    similarity_threshold = 0.90
WHERE q_id IS NULL;
```

## 🚀 How to Use

### As a Teacher:

1. **Login** with teacher account
2. **Click** 🎓 Teacher in navbar
3. **Monitor** active sessions
4. **View** student details
5. **Check** plagiarism by problem ID
6. **Review** events and logs

### As a Student:

- **Just solve problems normally!**
- Proctoring works automatically
- Right-click and DevTools are blocked
- Tab switches and pastes are logged
- Code is saved for similarity checking

## 📊 What Teachers Can See

### Overview Tab

- Total student count
- Active users right now
- High severity events count
- Live session feed with:
  - Student name
  - Problem being solved
  - Programming language
  - Time spent
  - Tab switches count
  - Paste count

### Students Tab

- Comprehensive student list
- Sortable table with:
  - Username and email
  - Problems solved
  - Active status
  - Total tab switches
  - Total copy/paste
  - High severity alerts
- Click any student for detailed profile

### Events Tab

- Complete event log
- Filter by severity, user, problem
- Timestamp for each event
- Event type and details

### Plagiarism Tab

- Enter problem ID
- Get similarity report
- See suspicious pairs
- Similarity percentage shown

## 🔐 Security Features

1. **Backend validation** - All teacher endpoints check role
2. **JWT authentication** - Required for all endpoints
3. **Role-based access** - Students cannot access teacher data
4. **SQL injection prevention** - Parameterized queries
5. **WebSocket security** - Authenticated connections only

## 🎯 Event Severity Levels

### Low (🟢)

- Window blur
- Small copy operations
- Right-click attempts

### Medium (🟠)

- Tab switches
- Medium paste operations
- Window focus changes

### High (🔴)

- DevTools access attempts
- Large paste operations (>100 chars)
- Repeated violations

## 📈 Performance Considerations

### Optimizations Included:

- Database indexes on frequently queried columns
- 5-second polling interval (not too frequent)
- Efficient SQL queries with joins
- Debounced event logging
- Auto-cleanup of old inactive sessions

### Recommendations:

- Set up cron job to clean old events (>30 days)
- Monitor database size with many users
- Consider implementing WebSocket for real-time (already prepared)

## 🔄 Real-Time Features

### Current Implementation:

- Dashboard auto-refreshes every 5 seconds
- WebSocket events prepared (emitted but not subscribed yet)
- Session tracking with timestamps

### WebSocket Events Available:

- `proctoring_event` - New event occurred
- `user_session_started` - Student started problem
- `user_session_ended` - Student finished problem

## ✅ Testing Checklist

Completed and Working:

- [x] Database migration
- [x] Teacher role creation
- [x] Teacher dashboard access
- [x] Student monitoring
- [x] Tab switch detection
- [x] Copy/paste tracking
- [x] DevTools prevention
- [x] Code submission tracking
- [x] Similarity detection
- [x] Real-time session tracking
- [x] Event logging
- [x] User profile views
- [x] Responsive design

## 🎓 Teacher Account Setup

To create a teacher account:

```sql
-- Option 1: Create new teacher
INSERT INTO users (username, email, password, role)
VALUES ('teacher1', 'teacher@example.com', 'password', 'teacher');

-- Option 2: Promote existing user
UPDATE users SET role = 'teacher' WHERE email = 'user@example.com';
```

## 📝 Key Implementation Details

### Code Similarity Algorithm:

- Uses Levenshtein distance
- Normalizes code (removes whitespace, comments, case)
- Compares all pairs of submissions
- Configurable threshold
- Returns suspicious pairs with scores

### Session Management:

- Auto-start when problem loads
- Auto-end when leaving page
- Updates on activity
- Tracks language changes
- Counts violations

### Event Logging:

- Non-blocking (doesn't affect UX)
- Categorized by type and severity
- Linked to user and problem
- Timestamped
- Searchable

## 🌟 Highlights

1. **Simple to Use**: Teachers just login and access dashboard
2. **Transparent to Students**: No intrusive prompts or warnings
3. **Comprehensive**: Tracks multiple violation types
4. **Configurable**: Settings can be adjusted per need
5. **Scalable**: Efficient database design
6. **Beautiful UI**: Modern, responsive design
7. **Real-time**: Live monitoring capabilities
8. **Secure**: Role-based access control

## 🎉 Summary

The proctoring system is fully functional and ready to use! It provides teachers with powerful monitoring capabilities while keeping the student experience smooth and uninterrupted. The system is simple, yet comprehensive, and can be easily extended with additional features in the future.

Key features:

- ✅ Teacher role with dashboard
- ✅ Student activity monitoring
- ✅ Code plagiarism detection
- ✅ Real-time session tracking
- ✅ Configurable settings
- ✅ Beautiful, responsive UI
- ✅ Complete documentation

Everything is kept simple as requested, but provides a solid foundation for academic integrity monitoring!
