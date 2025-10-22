# Proctoring System Documentation

## Overview

LogiCode now includes a comprehensive proctoring system to monitor student activities while solving coding problems. The system includes a teacher role with god-level permissions to view all platform activities, track suspicious behaviors, and detect code plagiarism.

## Features

### 1. **Teacher Role**

- Special role with comprehensive monitoring capabilities
- Cannot solve problems themselves
- Access to real-time dashboard showing all platform activities
- View detailed student activity logs
- Code plagiarism detection

### 2. **Student Monitoring**

The system tracks the following activities:

#### Tab Switching Detection

- Monitors when students switch away from the problem page
- Logs tab visibility changes
- Counts total tab switches per session

#### Copy/Paste Tracking

- Detects when students paste code into the editor
- Logs the amount of pasted content
- Higher severity for large paste operations (>100 characters)

#### Developer Tools Prevention

- Blocks right-click context menu
- Prevents opening DevTools with keyboard shortcuts:
  - F12
  - Ctrl+Shift+I
  - Ctrl+Shift+J
  - Ctrl+U

#### Code Similarity Detection

- Compares submitted code between different students
- Uses Levenshtein distance algorithm for similarity scoring
- Flags submissions with >85% similarity
- Normalizes code (removes comments and whitespace) for accurate comparison

### 3. **Real-Time Session Tracking**

- Active sessions showing who is solving which problem
- Language being used
- Time spent on problem
- Live activity indicators

## Database Schema

### Tables Created

#### 1. `proctoring_events`

Logs all suspicious activities:

- `event_id`: Primary key
- `user_id`: Student who triggered the event
- `q_id`: Problem being solved
- `event_type`: Type of event (tab_switch, paste, devtools_attempt, etc.)
- `event_details`: Additional details about the event
- `severity`: low, medium, or high
- `timestamp`: When the event occurred

#### 2. `active_sessions`

Tracks active problem-solving sessions:

- `session_id`: Primary key
- `user_id`: Student ID
- `username`: Student name
- `q_id`: Problem ID
- `problem_name`: Problem name
- `language`: Programming language being used
- `started_at`: Session start time
- `last_activity`: Last activity timestamp
- `is_active`: Boolean indicating if session is active
- `tab_switches`: Count of tab switches
- `copy_paste_count`: Count of paste operations

#### 3. `code_submissions`

Stores code submissions for plagiarism detection:

- `submission_id`: Primary key
- `user_id`: Student ID
- `q_id`: Problem ID
- `code`: Submitted code
- `language`: Programming language
- `submitted_at`: Submission timestamp
- `is_plagiarized`: Boolean flag
- `similarity_score`: Similarity percentage

#### 4. `proctoring_settings`

Configurable proctoring rules:

- `setting_id`: Primary key
- `q_id`: Problem ID (NULL for global settings)
- `enable_proctoring`: Toggle proctoring
- `max_tab_switches`: Maximum allowed tab switches
- `max_copy_paste`: Maximum allowed paste operations
- `disable_devtools`: Toggle DevTools prevention
- `track_similarity`: Toggle code similarity checking
- `similarity_threshold`: Minimum similarity to flag (default 0.85)

## API Endpoints

### Student Endpoints

#### `POST /api/proctoring/log-event`

Log a proctoring event

```json
{
  "q_id": 1,
  "event_type": "tab_switch",
  "event_details": "User switched away from the problem page",
  "severity": "medium"
}
```

#### `POST /api/proctoring/session`

Start or update a problem-solving session

```json
{
  "q_id": 1,
  "problem_name": "Two Sum",
  "language": "python"
}
```

#### `POST /api/proctoring/end-session`

End an active session

```json
{
  "q_id": 1
}
```

#### `POST /api/proctoring/update-counter`

Update activity counters

```json
{
  "q_id": 1,
  "counter_type": "tab_switch" // or "paste"
}
```

#### `POST /api/proctoring/submit-code`

Submit code for plagiarism tracking

```json
{
  "q_id": 1,
  "code": "def solution()...",
  "language": "python"
}
```

### Teacher Endpoints (Require Teacher/Admin Role)

#### `GET /api/teacher/active-sessions`

Get all currently active problem-solving sessions

#### `GET /api/teacher/proctoring-events`

Get proctoring events with optional filters
Query params:

- `limit`: Number of events to return (default 100)
- `severity`: Filter by severity (low/medium/high)
- `user_id`: Filter by user
- `q_id`: Filter by problem

#### `GET /api/teacher/users-overview`

Get overview of all students with statistics:

- Problems solved
- Active status
- Total tab switches
- Total copy/paste operations
- High severity events count

#### `GET /api/teacher/user/:userid`

Get detailed information about a specific user including:

- User profile
- Recent sessions
- Proctoring events
- Solved problems

#### `POST /api/teacher/check-similarity`

Check code similarity for a specific problem

```json
{
  "q_id": 1
}
```

Returns pairs of students with suspicious similarity scores.

## Teacher Dashboard

Access the teacher dashboard at `/teacher-dashboard`

### Dashboard Sections

#### 1. **Overview Tab**

- Statistics cards showing:
  - Total students
  - Currently active students
  - High severity events count
  - Total events
- Active sessions list with live indicators
- Recent proctoring events feed

#### 2. **Students Tab**

- Comprehensive table of all students
- Sortable by various metrics
- Click to view detailed student profile
- Visual indicators for suspicious activity
- Individual student views showing:
  - Recent sessions
  - All proctoring events
  - Solved problems

#### 3. **Events Tab**

- Complete log of all proctoring events
- Color-coded by severity:
  - 🟢 Low (green)
  - 🟠 Medium (orange)
  - 🔴 High (red)
- Filterable and searchable

#### 4. **Plagiarism Tab**

- Code similarity detection tool
- Enter problem ID to check all submissions
- Shows suspicious pairs with similarity percentage
- Visual comparison of flagged submissions

## Setup Instructions

### 1. Database Migration

Run the migration to create proctoring tables:

```bash
# Using MySQL client
mysql -u your_user -p your_database < backend/migrations/add_proctoring_system.sql

# Or using Node.js migration runner
node backend/run_migration.js backend/migrations/add_proctoring_system.sql
```

### 2. Create Teacher Account

You need to manually update a user's role to "teacher" in the database:

```sql
UPDATE users SET role = 'teacher' WHERE email = 'teacher@example.com';
```

Or use the existing admin functionality if available.

### 3. Configuration

The system uses default settings but can be customized via the `proctoring_settings` table:

```sql
-- Update global settings
UPDATE proctoring_settings
SET max_tab_switches = 10,
    max_copy_paste = 20,
    similarity_threshold = 0.90
WHERE q_id IS NULL;

-- Add problem-specific settings
INSERT INTO proctoring_settings
(q_id, enable_proctoring, max_tab_switches, max_copy_paste)
VALUES (1, TRUE, 3, 5);
```

## Usage Guide

### For Teachers

1. **Login** with a teacher account
2. **Navigate** to Teacher Dashboard using the 🎓 Teacher link in the navbar
3. **Monitor** active sessions in real-time
4. **Review** proctoring events for suspicious activities
5. **Check plagiarism** by entering problem ID in the Plagiarism tab
6. **View** detailed student profiles by clicking on any student

### For Students

Students don't need to do anything special. The proctoring system runs automatically when they:

- Open a problem page
- Start solving
- Submit their code

Proctoring is transparent to students except for:

- DevTools shortcuts being blocked
- Right-click being disabled

## Event Severity Levels

### Low Severity

- Window blur (switching to another window briefly)
- Small copy operations (<50 characters)
- Right-click attempts

### Medium Severity

- Tab switches
- Paste operations (50-100 characters)
- General suspicious behavior

### High Severity

- DevTools access attempts
- Large paste operations (>100 characters)
- Multiple repeated violations

## WebSocket Events

The system emits real-time events via WebSocket:

- `proctoring_event`: New proctoring event occurred
- `user_session_started`: Student started solving a problem
- `user_session_ended`: Student finished/left a problem

## Privacy & Ethics Considerations

While the proctoring system is comprehensive, consider:

1. **Transparency**: Inform students that monitoring is in place
2. **Data Retention**: Regularly clean up old proctoring data
3. **False Positives**: Tab switches may be legitimate (looking up documentation)
4. **Accessibility**: Ensure proctoring doesn't interfere with assistive technologies

## Limitations

The current simple implementation has some limitations:

1. **Code Similarity**: Uses basic Levenshtein distance - may not catch sophisticated plagiarism
2. **DevTools Prevention**: Can be bypassed by determined students
3. **Tab Detection**: Cannot detect external code editors or resources
4. **Performance**: Large numbers of concurrent sessions may impact database

## Future Enhancements

Potential improvements:

1. Advanced plagiarism detection using AST (Abstract Syntax Tree) comparison
2. Screenshot/screen recording capabilities
3. Webcam monitoring (with proper consent)
4. AI-powered suspicious behavior detection
5. Automated alerts for teachers
6. Student-facing proctoring warnings
7. Configurable proctoring per problem/exam
8. Export reports for academic integrity investigations

## Troubleshooting

### Teacher Dashboard Not Accessible

- Check that user role is set to "teacher" or "admin" in database
- Verify JWT token includes role information

### Events Not Logging

- Check browser console for errors
- Verify API endpoints are responding
- Check database permissions

### Code Similarity Not Working

- Ensure code_submissions table exists
- Verify students are submitting code
- Check similarity threshold settings

## Security Notes

1. Teacher role verification happens on backend
2. All proctoring endpoints require authentication
3. Students cannot access teacher endpoints (403 Forbidden)
4. Code submissions are stored securely in database
5. WebSocket events only broadcast to authenticated users

## Support

For issues or questions:

1. Check backend logs for errors
2. Verify database schema is correctly set up
3. Test with sample data
4. Review browser console for frontend errors
