# Quick Setup Guide for Proctoring System

## Step-by-Step Setup

### 1. Run Database Migration

**Option A: Using MySQL Client**

```bash
# Replace with your actual database credentials
mysql -u your_username -p your_database_name < backend/migrations/add_proctoring_system.sql
```

**Option B: Using the Migration Runner Script**

```bash
cd backend
node run_migration.js migrations/add_proctoring_system.sql
```

### 2. Create a Teacher Account

**Option A: Create New Teacher User**

```sql
-- Create a new teacher account
INSERT INTO users (username, email, password, role)
VALUES ('teacher1', 'teacher@example.com', 'password123', 'teacher');
```

**Option B: Promote Existing User to Teacher**

```sql
-- Find user ID first
SELECT userid, username, email, role FROM users;

-- Update the user's role
UPDATE users SET role = 'teacher' WHERE userid = YOUR_USER_ID;
-- OR
UPDATE users SET role = 'teacher' WHERE email = 'your@email.com';
```

### 3. Verify Installation

Login to the application and check:

**As a Teacher:**

1. You should see "🎓 Teacher" link in the navbar
2. Click it to access the Teacher Dashboard
3. Dashboard should load with 4 tabs: Overview, Students, Events, Plagiarism

**As a Student:**

1. Open any problem
2. Try switching tabs (this will be logged)
3. Try right-clicking (should be blocked)
4. Try pressing F12 (should be blocked)

### 4. Test the System

**Create Test Data:**

```sql
-- Check if tables exist
SHOW TABLES LIKE 'proctoring%';
SHOW TABLES LIKE 'active_sessions';
SHOW TABLES LIKE 'code_submissions';

-- View table structure
DESCRIBE proctoring_events;
DESCRIBE active_sessions;
DESCRIBE code_submissions;
DESCRIBE proctoring_settings;
```

**As Teacher, Check Dashboard:**

1. Go to `/teacher-dashboard`
2. Overview tab should show stats
3. Students tab should list all students
4. Events tab should show proctoring events
5. Plagiarism tab allows code similarity checking

### 5. Configure Settings (Optional)

Adjust proctoring sensitivity:

```sql
-- View current settings
SELECT * FROM proctoring_settings;

-- Update global settings
UPDATE proctoring_settings
SET
  max_tab_switches = 10,        -- Allow up to 10 tab switches
  max_copy_paste = 20,           -- Allow up to 20 paste operations
  similarity_threshold = 0.90    -- Flag 90%+ similar code
WHERE q_id IS NULL;

-- Enable proctoring for specific problem
INSERT INTO proctoring_settings
(q_id, enable_proctoring, max_tab_switches, max_copy_paste)
VALUES (1, TRUE, 5, 10);
```

## Quick Verification Checklist

- [ ] Database migration completed successfully
- [ ] At least one teacher account created
- [ ] Teacher can access `/teacher-dashboard`
- [ ] Teacher dashboard loads without errors
- [ ] Student problem page has proctoring active
- [ ] Right-click is disabled on problem page
- [ ] F12 and DevTools shortcuts are blocked
- [ ] Tab switches are being logged
- [ ] Code submissions are being tracked

## Common Issues & Solutions

### Issue: Teacher Dashboard shows "Access Denied"

**Solution:**

```sql
-- Verify user role
SELECT userid, username, email, role FROM users WHERE email = 'your@email.com';

-- If role is not 'teacher' or 'admin', update it
UPDATE users SET role = 'teacher' WHERE email = 'your@email.com';
```

### Issue: Tables not found error

**Solution:**

```bash
# Re-run the migration
mysql -u your_username -p your_database_name < backend/migrations/add_proctoring_system.sql
```

### Issue: Events not appearing in dashboard

**Solution:**

1. Check browser console for errors
2. Verify backend is running
3. Check network tab for failed API requests
4. Verify database connection in backend

### Issue: Proctoring not active on problem page

**Solution:**

1. Check browser console for errors
2. Verify user is logged in
3. Hard refresh the page (Ctrl+Shift+R)

## Testing the System

### Test Proctoring Detection

1. **Login as a student**
2. **Open a problem**
3. **Perform these actions:**

   - Switch to another tab → Should log "tab_switch"
   - Try right-clicking → Should be blocked and logged
   - Try pressing F12 → Should be blocked and logged
   - Paste some code → Should log "paste"
   - Copy text → Should log "copy" if >50 chars

4. **Login as teacher**
5. **Open Teacher Dashboard**
6. **Check Events tab** → Should see all the logged events

### Test Code Similarity

1. **Have 2 students submit similar code for the same problem**
2. **Login as teacher**
3. **Go to Plagiarism tab**
4. **Enter the problem ID**
5. **Click "Check Similarity"**
6. **Should show suspicious pairs if similarity > 85%**

## Admin Tasks

### View All Proctoring Events

```sql
SELECT
  e.event_id,
  u.username,
  e.event_type,
  e.severity,
  e.timestamp,
  q.qname
FROM proctoring_events e
JOIN users u ON e.user_id = u.userid
LEFT JOIN questions q ON e.q_id = q.q_id
ORDER BY e.timestamp DESC
LIMIT 50;
```

### View Active Sessions

```sql
SELECT
  s.*,
  u.email
FROM active_sessions s
JOIN users u ON s.user_id = u.userid
WHERE s.is_active = TRUE
ORDER BY s.last_activity DESC;
```

### Find Students with High Violations

```sql
SELECT
  u.username,
  u.email,
  COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_violations,
  COUNT(CASE WHEN e.severity = 'medium' THEN 1 END) as medium_violations,
  COUNT(*) as total_events
FROM users u
LEFT JOIN proctoring_events e ON u.userid = e.user_id
GROUP BY u.userid, u.username, u.email
HAVING high_violations > 0
ORDER BY high_violations DESC;
```

### Clean Up Old Data

```sql
-- Remove events older than 30 days
DELETE FROM proctoring_events
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Remove inactive sessions older than 7 days
DELETE FROM active_sessions
WHERE is_active = FALSE
AND last_activity < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Remove old code submissions (keep only latest 3 per student per problem)
DELETE cs1 FROM code_submissions cs1
INNER JOIN (
  SELECT user_id, q_id, submission_id
  FROM (
    SELECT user_id, q_id, submission_id,
           ROW_NUMBER() OVER (PARTITION BY user_id, q_id ORDER BY submitted_at DESC) as rn
    FROM code_submissions
  ) ranked
  WHERE rn > 3
) cs2 ON cs1.submission_id = cs2.submission_id;
```

## Production Considerations

1. **Index Optimization:**

```sql
-- Add indexes for better performance
CREATE INDEX idx_events_timestamp ON proctoring_events(timestamp);
CREATE INDEX idx_events_user_severity ON proctoring_events(user_id, severity);
CREATE INDEX idx_sessions_active ON active_sessions(is_active, last_activity);
```

2. **Set up automated cleanup:**
   Create a cron job or scheduled task to run cleanup queries daily/weekly

3. **Monitor database size:**
   Proctoring tables can grow quickly with many users

4. **Backup regularly:**
   Ensure proctoring data is included in regular backups

## Need Help?

1. Check the main `PROCTORING_SYSTEM.md` for detailed documentation
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Verify all database tables were created successfully
5. Test with a simple use case first before rolling out widely

## Summary

The proctoring system is now installed! Teachers can monitor student activities in real-time, track suspicious behaviors, and detect code plagiarism. Students solving problems will have their activities tracked automatically while maintaining a smooth user experience.
