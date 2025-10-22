# Ready-to-Use Performance Metrics Code

## 🎯 Summary

Piston **DOES** return performance metrics (runtime & memory), but your code isn't capturing them.  
Here's the exact code to add LeetCode-style performance display.

---

## 1️⃣ Backend Changes

### A. Update `/api/runtestcases` endpoint (Line ~756)

**FIND THIS (around line 756):**

```javascript
results.push({
  input: testc.ip,
  expected: expectedOutput,
  actual: actualOutput,
  passed: actualOutput === expectedOutput && !data.run.stderr,
  error: data.run.stderr || data.compile?.stderr || null,
});
```

**REPLACE WITH:**

```javascript
results.push({
  input: testc.ip,
  expected: expectedOutput,
  actual: actualOutput,
  passed: actualOutput === expectedOutput && !data.run.stderr,
  error: data.run.stderr || data.compile?.stderr || null,

  // ✅ ADD PERFORMANCE METRICS
  performance: {
    cpu_time: data.run?.cpu_time || 0, // milliseconds
    wall_time: data.run?.wall_time || 0, // milliseconds
    memory: data.run?.memory || 0, // bytes
    memory_mb: ((data.run?.memory || 0) / 1024 / 1024).toFixed(2), // MB
    status: data.run?.status || null, // execution status
  },
});
```

### B. Update `/api/checktc` endpoint (Line ~783)

**ADD THIS** after line 838 (where you declare variables):

```javascript
let performanceMetrics = []; // Track performance across test cases
```

**THEN MODIFY** the `testQuestion` function (around line 884):

**FIND:**

```javascript
if (data.run.stderr) {
  error = data.run.stderr;
  status = false;
  return false;
} else if ((data.run.stdout || "").trim() != (testc.op || "").trim()) {
  your_output = data.run.stdout;
  return false;
}
return true;
```

**REPLACE WITH:**

```javascript
if (data.run.stderr) {
  error = data.run.stderr;
  status = false;
  return false;
} else if ((data.run.stdout || "").trim() != (testc.op || "").trim()) {
  your_output = data.run.stdout;
  return false;
}

// ✅ ADD: Collect performance metrics for successful runs
performanceMetrics.push({
  cpu_time: data.run?.cpu_time || 0,
  wall_time: data.run?.wall_time || 0,
  memory: data.run?.memory || 0,
});

return true;
```

**THEN ADD** at the end of the endpoint (around line 910), **BEFORE** `res.json()`:

```javascript
// Calculate average performance metrics
let avgMetrics = null;
if (performanceMetrics.length > 0) {
  avgMetrics = {
    avg_cpu_time: Math.round(
      performanceMetrics.reduce((sum, m) => sum + m.cpu_time, 0) /
        performanceMetrics.length
    ),
    avg_wall_time: Math.round(
      performanceMetrics.reduce((sum, m) => sum + m.wall_time, 0) /
        performanceMetrics.length
    ),
    avg_memory: Math.round(
      performanceMetrics.reduce((sum, m) => sum + m.memory, 0) /
        performanceMetrics.length
    ),
    max_memory: Math.max(...performanceMetrics.map((m) => m.memory)),
    total_time: performanceMetrics.reduce((sum, m) => sum + m.wall_time, 0),
    memory_mb: (
      Math.max(...performanceMetrics.map((m) => m.memory)) /
      1024 /
      1024
    ).toFixed(2),
    test_cases: performanceMetrics.length,
  };
}

res.json({
  status,
  error,
  wrong_input,
  your_output,
  expected_output,
  performance: avgMetrics, // ✅ ADD THIS
});
```

---

## 2️⃣ Frontend Changes

### A. Update Output.jsx State (Line ~6)

**ADD** this state variable:

```javascript
const [performanceData, setPerformanceData] = useState(null);
```

### B. Update `check()` function (Line ~48)

**FIND:**

```javascript
const data = await response.json();
console.log(data.remark);

data.remark === "correct" ? setRBC("#4caf50") : setRBC("#f44336");
```

**ADD AFTER:**

```javascript
const data = await response.json();
console.log(data.remark);

data.remark === "correct" ? setRBC("#4caf50") : setRBC("#f44336");

// ✅ ADD: Capture performance data
if (data.performance) {
  setPerformanceData(data.performance);
  console.log("Performance metrics:", data.performance);
}
```

### C. Display Performance in Result Section (Line ~330)

**FIND** the result-details div (around line 352):

```javascript
{
  wInput && (
    <div className="result-details">
      <div className="result-item">
        <strong>Input:</strong> {wInput}
      </div>
      <div className="result-item">
        <strong>Your Output:</strong> {yInput}
      </div>
      <div className="result-item">
        <strong>Expected Output:</strong> {expectedIP}
      </div>
    </div>
  );
}
```

**ADD AFTER (before the closing )})**:

```javascript
{
  /* ✅ PERFORMANCE METRICS DISPLAY */
}
{
  performanceData && status === "correct" && (
    <div className="performance-metrics">
      <h4 className="performance-title">⚡ Performance</h4>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-value">{performanceData.avg_wall_time}ms</div>
          <div className="metric-label">Runtime</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🧠</div>
          <div className="metric-value">{performanceData.avg_cpu_time}ms</div>
          <div className="metric-label">CPU Time</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💾</div>
          <div className="metric-value">{performanceData.memory_mb} MB</div>
          <div className="metric-label">Memory</div>
        </div>
      </div>
      <div className="performance-summary">
        <span>✅ All {performanceData.test_cases} test cases passed</span>
        <span>• Total time: {performanceData.total_time}ms</span>
      </div>
    </div>
  );
}
```

### D. Show Per-Test-Case Performance (Line ~203)

**FIND:**

```javascript
data.results.forEach((result, index) => {
  outputMsg += `Test Case ${index + 1}:\n`;
  outputMsg += `Input: ${result.input}\n`;
  outputMsg += `Expected: ${result.expected}\n`;
  outputMsg += `Your Output: ${result.actual}\n`;
  outputMsg += `Status: ${result.passed ? "✅ PASS" : "❌ FAIL"}\n`;
  if (result.error) {
    outputMsg += `Error: ${result.error}\n`;
  }
  outputMsg += "\n";
});
```

**REPLACE WITH:**

```javascript
data.results.forEach((result, index) => {
  outputMsg += `Test Case ${index + 1}:\n`;
  outputMsg += `Input: ${result.input}\n`;
  outputMsg += `Expected: ${result.expected}\n`;
  outputMsg += `Your Output: ${result.actual}\n`;
  outputMsg += `Status: ${result.passed ? "✅ PASS" : "❌ FAIL"}\n`;

  // ✅ ADD PERFORMANCE INFO
  if (result.performance) {
    outputMsg += `⏱️  Runtime: ${result.performance.wall_time}ms\n`;
    outputMsg += `💾 Memory: ${result.performance.memory_mb}MB\n`;
  }

  if (result.error) {
    outputMsg += `Error: ${result.error}\n`;
  }
  outputMsg += "\n";
});
```

---

## 3️⃣ CSS Styling (Add to Output.css)

**ADD THIS** at the end of `Output.css`:

```css
/* Performance Metrics Display */
.performance-metrics {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.1) 0%,
    rgba(102, 126, 234, 0.1) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.performance-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.metric-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin: 0.3rem 0;
}

.metric-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.performance-summary {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .performance-summary {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

---

## 4️⃣ Optional: Performance Leaderboard

### Create Database Table

```sql
CREATE TABLE IF NOT EXISTS performance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  q_id INT NOT NULL,
  user_id INT NOT NULL,
  language VARCHAR(50) NOT NULL,
  avg_cpu_time INT,
  avg_wall_time INT,
  avg_memory BIGINT,
  max_memory BIGINT,
  total_time INT,
  test_cases_passed INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (q_id) REFERENCES questions(q_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_problem_perf (q_id, avg_wall_time)
);
```

### Backend Endpoint to Save Performance

```javascript
app.post("/api/save-performance", async (req, res) => {
  const { qid, userid, language, performance } = req.body;

  try {
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO performance_records 
        (q_id, user_id, language, avg_cpu_time, avg_wall_time, avg_memory, max_memory, total_time, test_cases_passed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          qid,
          userid,
          language,
          performance.avg_cpu_time,
          performance.avg_wall_time,
          performance.avg_memory,
          performance.max_memory,
          performance.total_time,
          performance.test_cases,
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // Calculate percentile
    const percentile = await new Promise((resolve, reject) => {
      db.query(
        `SELECT COUNT(*) as faster FROM performance_records 
         WHERE q_id = ? AND language = ? AND avg_wall_time > ?`,
        [qid, language, performance.avg_wall_time],
        (err, result) => {
          if (err) return reject(err);
          db.query(
            `SELECT COUNT(*) as total FROM performance_records 
             WHERE q_id = ? AND language = ?`,
            [qid, language],
            (err2, result2) => {
              if (err2) return reject(err2);
              const percent =
                result2[0].total > 0
                  ? Math.round((result[0].faster / result2[0].total) * 100)
                  : 0;
              resolve(percent);
            }
          );
        }
      );
    });

    res.json({ success: true, percentile });
  } catch (error) {
    console.error("Error saving performance:", error);
    res.status(500).json({ error: "Failed to save performance" });
  }
});
```

---

## 📊 Expected Result

After implementing, users will see:

```
✅ Accepted

⚡ Performance
┌──────────────┬─────────────┬─────────────┐
│  ⏱️ Runtime  │ 🧠 CPU Time │  💾 Memory  │
│    154ms     │     12ms    │   1.16 MB   │
└──────────────┴─────────────┴─────────────┘

✅ All 5 test cases passed • Total time: 623ms
```

---

## ✅ Implementation Checklist

1. [ ] Update backend `/api/runtestcases` (Section 1.A)
2. [ ] Update backend `/api/checktc` (Section 1.B)
3. [ ] Add state in Output.jsx (Section 2.A)
4. [ ] Capture performance in check() (Section 2.B)
5. [ ] Display metrics in Result tab (Section 2.C)
6. [ ] Show per-test performance in Run output (Section 2.D)
7. [ ] Add CSS styling (Section 3)
8. [ ] Test the implementation
9. [ ] (Optional) Add database tracking (Section 4)
10. [ ] (Optional) Add percentile rankings

---

**Total Implementation Time:** ~30-45 minutes  
**Difficulty:** Easy (copy-paste with minor adjustments)  
**Impact:** High (users love seeing performance metrics!)

🎯 **The data is already there - you just need to display it!**
