# Performance Metrics Implementation Guide

## Overview

Piston API already returns performance metrics with every code execution. We can capture and display these to give users LeetCode-style performance feedback.

## Metrics Available from Piston

From the Piston API response:

```json
{
  "run": {
    "stdout": "output",
    "stderr": "",
    "code": 0,
    "signal": null,
    "cpu_time": 8, // ✅ CPU time in milliseconds
    "wall_time": 154, // ✅ Wall clock time in milliseconds
    "memory": 1160000 // ✅ Memory usage in bytes
  }
}
```

## Implementation Steps

### 1. Backend Changes (index.js)

#### A. Update `/api/runtestcases` endpoint

Capture and return performance metrics:

```javascript
results.push({
  input: testc.ip,
  expected: expectedOutput,
  actual: actualOutput,
  passed: actualOutput === expectedOutput && !data.run.stderr,
  error: data.run.stderr || data.compile?.stderr || null,
  // ADD THESE PERFORMANCE METRICS:
  performance: {
    cpu_time: data.run.cpu_time || 0, // milliseconds
    wall_time: data.run.wall_time || 0, // milliseconds
    memory: data.run.memory || 0, // bytes
    memory_mb: ((data.run.memory || 0) / 1024 / 1024).toFixed(2), // MB
  },
});
```

#### B. Update `/api/checktc` endpoint

Add performance tracking:

```javascript
// Inside testQuestion function, after getting Piston response:
if (data.run.stdout.trim() == testc.op.trim() && !data.run.stderr) {
  // Collect performance metrics for successful runs
  performanceMetrics.push({
    cpu_time: data.run.cpu_time || 0,
    wall_time: data.run.wall_time || 0,
    memory: data.run.memory || 0,
  });
  return true;
}

// After all tests, calculate averages:
const avgMetrics = {
  avg_cpu_time:
    performanceMetrics.reduce((sum, m) => sum + m.cpu_time, 0) /
    performanceMetrics.length,
  avg_wall_time:
    performanceMetrics.reduce((sum, m) => sum + m.wall_time, 0) /
    performanceMetrics.length,
  avg_memory:
    performanceMetrics.reduce((sum, m) => sum + m.memory, 0) /
    performanceMetrics.length,
  max_memory: Math.max(...performanceMetrics.map((m) => m.memory)),
  total_time: performanceMetrics.reduce((sum, m) => sum + m.wall_time, 0),
};

res.json({
  status,
  error,
  wrong_input,
  your_output,
  expected_output,
  performance: avgMetrics, // ADD THIS
});
```

### 2. Frontend Changes

#### A. Update Output Component

Display performance metrics after submission:

```jsx
{
  performanceData && (
    <div className="performance-section">
      <h4>⚡ Performance Metrics</h4>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-value">{performanceData.avg_cpu_time}ms</div>
          <div className="metric-label">CPU Time</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🕐</div>
          <div className="metric-value">{performanceData.avg_wall_time}ms</div>
          <div className="metric-label">Runtime</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💾</div>
          <div className="metric-value">
            {(performanceData.avg_memory / 1024 / 1024).toFixed(2)} MB
          </div>
          <div className="metric-label">Memory</div>
        </div>
      </div>
    </div>
  );
}
```

#### B. Show Per-Test-Case Performance

In test results display:

```jsx
{
  results.map((result, index) => (
    <div key={index} className="test-case-result">
      <div className="test-info">
        <span>Test Case {index + 1}</span>
        <span className={result.passed ? "passed" : "failed"}>
          {result.passed ? "✓ Passed" : "✗ Failed"}
        </span>
      </div>

      {result.performance && (
        <div className="test-performance">
          <span>⏱️ {result.performance.wall_time}ms</span>
          <span>💾 {result.performance.memory_mb}MB</span>
        </div>
      )}
    </div>
  ));
}
```

### 3. Optional Enhancements

#### A. Store Performance Records in Database

Create a table to track best performances:

```sql
CREATE TABLE performance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  q_id INT,
  user_id INT,
  language VARCHAR(50),
  avg_cpu_time INT,
  avg_wall_time INT,
  avg_memory BIGINT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (q_id) REFERENCES questions(q_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

#### B. Show Performance Ranking

Compare user's performance to others:

```javascript
// Calculate percentile
const fasterThan = await db.query(
  `SELECT COUNT(*) as count FROM performance_records 
   WHERE q_id = ? AND avg_wall_time > ?`,
  [qid, userTime]
);

const total = await db.query(
  `SELECT COUNT(*) as count FROM performance_records WHERE q_id = ?`,
  [qid]
);

const percentile = (fasterThan / total) * 100;
// "Faster than 75% of submissions"
```

#### C. Performance Badges

Award badges for exceptional performance:

- 🏃 "Speed Demon" - Top 10% runtime
- 🎯 "Memory Efficient" - Top 10% memory usage
- ⚡ "Lightning Fast" - Fastest solution for a problem

## Display Examples

### LeetCode-Style Performance Display:

```
✅ Accepted
Runtime: 154ms          Beats 78.5% of users
Memory: 1.16MB          Beats 82.3% of users
```

### Detailed View:

```
Performance Metrics
─────────────────────────────────────
⏱️  CPU Time:      8ms
🕐  Runtime:       154ms
💾  Memory:        1.16 MB
📊  Test Cases:    All 15 passed
⚡  Status:        Faster than 78.5% of solutions
```

## Important Notes

1. **Big-O Complexity**: Piston cannot calculate algorithmic complexity (O(n), O(n²), etc.). This would require static code analysis, which Piston doesn't provide.

2. **Metrics Variability**: Performance can vary between runs due to:

   - Server load
   - CPU scheduling
   - Memory allocation
   - Network latency

3. **Meaningful Comparisons**: Compare metrics:

   - Across test cases (same code)
   - Against other solutions (same problem)
   - Before/after optimizations

4. **Memory Measurement**: Piston measures total process memory, not just algorithm-specific memory usage.

## Benefits

✅ Users get instant performance feedback  
✅ Encourages code optimization  
✅ Creates competitive leaderboards  
✅ Similar UX to LeetCode/HackerRank  
✅ All data already available from Piston!
