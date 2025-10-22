# Proctoring System - Quick Start ⚡

## 🚀 Installation (3 Steps)

### 1. Run Database Migration

```bash
mysql -u your_user -p your_database < backend/migrations/add_proctoring_system.sql
```

### 2. Create Teacher Account

```sql
UPDATE users SET role = 'teacher' WHERE email = 'your@email.com';
```

### 3. Done!

Access teacher dashboard at: `http://your-domain/teacher-dashboard`

---

## 👨‍🏫 Teacher Features

### Access Dashboard

- Login → Click "🎓 Teacher" in navbar → View dashboard

### Monitor Students

- **Overview Tab**: See who's active right now
- **Students Tab**: View all students and their stats
- **Events Tab**: See all suspicious activities
- **Plagiarism Tab**: Check code similarity

### Check Plagiarism

1. Go to Plagiarism tab
2. Enter problem ID
3. Click "Check Similarity"
4. View suspicious pairs

---

## 🎓 What Gets Tracked

| Activity        | Detection  | Severity    |
| --------------- | ---------- | ----------- |
| Tab switching   | ✅ Yes     | Medium      |
| Copy/paste      | ✅ Yes     | Medium/High |
| Right-click     | ✅ Blocked | Low         |
| DevTools (F12)  | ✅ Blocked | High        |
| Code similarity | ✅ Yes     | N/A         |

---

## 📊 Teacher Dashboard Tabs

### 1️⃣ Overview

- Stats cards (students, active, events)
- Live sessions feed
- Recent events

### 2️⃣ Students

- All students table
- Click student → View details
- See violations per student

### 3️⃣ Events

- Complete event log
- Color-coded by severity
- Filter by user/problem

### 4️⃣ Plagiarism

- Enter problem ID
- Check code similarity
- View suspicious pairs (>85% similar)

---

## 🔑 Important Endpoints

**Teacher Only:**

- `GET /api/teacher/active-sessions`
- `GET /api/teacher/users-overview`
- `GET /api/teacher/proctoring-events`
- `POST /api/teacher/check-similarity`

---

## ⚙️ Configuration

**View Settings:**

```sql
SELECT * FROM proctoring_settings;
```

**Update Settings:**

```sql
UPDATE proctoring_settings
SET max_tab_switches = 10,
    max_copy_paste = 20,
    similarity_threshold = 0.90
WHERE q_id IS NULL;
```

---

## 🎨 Severity Colors

- 🟢 **Low**: Green (window blur, small copies)
- 🟠 **Medium**: Orange (tab switches, pastes)
- 🔴 **High**: Red (DevTools attempts, large pastes)

---

## 📱 URLs

| Page              | URL                  | Access        |
| ----------------- | -------------------- | ------------- |
| Teacher Dashboard | `/teacher-dashboard` | Teacher/Admin |
| Student Problems  | `/problem/:qid`      | All Users     |
| Profile           | `/profile`           | All Users     |

---

## 🔍 Quick SQL Queries

**Find Students with High Violations:**

```sql
SELECT u.username, COUNT(*) as violations
FROM proctoring_events e
JOIN users u ON e.user_id = u.userid
WHERE e.severity = 'high'
GROUP BY u.userid
ORDER BY violations DESC;
```

**View Active Sessions:**

```sql
SELECT username, problem_name, language, started_at
FROM active_sessions
WHERE is_active = TRUE;
```

**Check Recent Events:**

```sql
SELECT u.username, e.event_type, e.severity, e.timestamp
FROM proctoring_events e
JOIN users u ON e.user_id = u.userid
ORDER BY e.timestamp DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

| Issue                  | Solution                                |
| ---------------------- | --------------------------------------- |
| Can't access dashboard | Check user role is 'teacher' or 'admin' |
| No events showing      | Try solving a problem as student first  |
| Similarity not working | Submit code from 2+ students            |
| Events not logging     | Check browser console for errors        |

---

## 📚 Full Documentation

- **Complete Guide**: `PROCTORING_SYSTEM.md`
- **Setup Guide**: `SETUP_PROCTORING.md`
- **Summary**: `PROCTORING_SUMMARY.md`

---

## ✨ Features Summary

✅ Teacher role with god-level view  
✅ Real-time student monitoring  
✅ Tab switch detection  
✅ Copy/paste tracking  
✅ DevTools prevention  
✅ Code plagiarism detection  
✅ Beautiful dashboard UI  
✅ Live session tracking  
✅ Configurable settings  
✅ Event severity levels

---

## 🎯 Quick Test

**As Student:**

1. Open problem → Session starts ✅
2. Switch tab → Logged as "tab_switch" ✅
3. Try F12 → Blocked and logged ✅
4. Paste code → Logged as "paste" ✅
5. Submit → Code saved for similarity ✅

**As Teacher:**

1. Go to `/teacher-dashboard` ✅
2. See student in Overview tab ✅
3. Check Events tab → See all logs ✅
4. Go to Plagiarism → Check similarity ✅

---

**That's it! You're ready to use the proctoring system! 🎉**
