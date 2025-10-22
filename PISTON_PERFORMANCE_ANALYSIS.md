# Piston Performance Metrics - Complete Analysis

## 🔍 What You Asked

> "Can you explore piston and check if there is any option to show space and time complexity, just like leetcode does?"

## ✅ What Piston Provides

### Performance Metrics Available:

According to the official Piston API documentation, **every execution returns:**

```json
{
  "run": {
    "stdout": "output...",
    "stderr": "",
    "code": 0,
    "signal": null,
    "cpu_time": 8, // ✅ CPU time in milliseconds
    "wall_time": 154, // ✅ Wall clock time in milliseconds
    "memory": 1160000 // ✅ Memory usage in bytes (1.16 MB)
  }
}
```

## ❌ What Piston Does NOT Provide

1. **Big-O Complexity Analysis** (O(n), O(n²), O(log n), etc.)

   - Requires static code analysis
   - Would need separate tool like:
     - Manual analysis
     - AI-based analysis
     - Custom complexity analyzer

2. **Automatic Algorithm Classification**

   - Cannot determine if your algorithm is optimal
   - Cannot suggest better approaches

3. **LeetCode's "Analyze Complexity" Feature**
   - Note: Even LeetCode's feature is often inaccurate
   - Users report many false positives/negatives

## ✅ What You CAN Implement (LeetCode-Style)

### 1. **Runtime Display**

Show execution time for each test case:

```
Runtime: 154ms
Beats 78% of submissions
```

### 2. **Memory Usage**

Display memory consumption:

```
Memory: 1.16 MB
Beats 82% of submissions
```

### 3. **Performance Comparison**

Store and compare against other submissions:

```
Your Performance:
  Time:   154ms (Top 22%)
  Memory: 1.16MB (Top 18%)

Fastest Solution: 89ms
Most Efficient:   0.8MB
```

### 4. **Per-Test-Case Metrics**

```
Test Case 1: ✓ Passed (12ms, 0.9MB)
Test Case 2: ✓ Passed (145ms, 1.1MB)
Test Case 3: ✓ Passed (98ms, 1.0MB)
```

## 📊 Current Implementation Status

### ❌ Your Backend Currently Does NOT Capture:

Looking at your `/api/runtestcases` and `/api/checktc` endpoints:

```javascript
// Line 756-762: Only captures pass/fail, not performance
results.push({
  input: testc.ip,
  expected: expectedOutput,
  actual: actualOutput,
  passed: actualOutput === expectedOutput && !data.run.stderr,
  error: data.run.stderr || data.compile?.stderr || null,
  // ❌ Missing: cpu_time, wall_time, memory
});
```

### ✅ Easy Fix - Add These Lines:

```javascript
results.push({
  input: testc.ip,
  expected: expectedOutput,
  actual: actualOutput,
  passed: actualOutput === expectedOutput && !data.run.stderr,
  error: data.run.stderr || data.compile?.stderr || null,

  // ✅ ADD THESE:
  performance: {
    cpu_time: data.run?.cpu_time || 0,
    wall_time: data.run?.wall_time || 0,
    memory: data.run?.memory || 0,
    memory_mb: ((data.run?.memory || 0) / 1024 / 1024).toFixed(2),
  },
});
```

## 🎯 Recommended Implementation

### Phase 1: Basic Performance Display (Easy)

1. Capture metrics from Piston (5 minutes)
2. Display in Output component (15 minutes)
3. Show per-test-case performance (10 minutes)

### Phase 2: Performance Tracking (Medium)

1. Create `performance_records` table (10 minutes)
2. Store user submissions (20 minutes)
3. Calculate percentiles (30 minutes)

### Phase 3: Advanced Features (Optional)

1. Performance leaderboards
2. Historical performance charts
3. Optimization suggestions (AI)
4. Performance badges/achievements

## 📝 Example Frontend Display

### Simple Version:

```jsx
{
  testResults.map((result, index) => (
    <div key={index} className="test-case">
      <div className="test-status">
        Test {index + 1}: {result.passed ? "✅" : "❌"}
      </div>

      {/* ADD THIS */}
      {result.performance && (
        <div className="test-metrics">
          <span>⏱️ {result.performance.wall_time}ms</span>
          <span>💾 {result.performance.memory_mb}MB</span>
        </div>
      )}
    </div>
  ));
}
```

### LeetCode-Style Version:

```jsx
{
  /* After submission */
}
<div className="performance-summary">
  <div className="performance-header">
    <h3>✅ Accepted</h3>
  </div>

  <div className="performance-stats">
    <div className="stat-item">
      <div className="stat-label">Runtime</div>
      <div className="stat-value">{avgRuntime}ms</div>
      <div className="stat-rank">Beats {percentile}%</div>
    </div>

    <div className="stat-item">
      <div className="stat-label">Memory</div>
      <div className="stat-value">{avgMemory}MB</div>
      <div className="stat-rank">Beats {memPercentile}%</div>
    </div>
  </div>
</div>;
```

## 🎨 Sample CSS for Performance Display

```css
.performance-summary {
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.1) 0%,
    rgba(102, 126, 234, 0.1) 100%
  );
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.performance-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #667eea;
  margin: 0.5rem 0;
}

.stat-rank {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}
```

## 📈 Database Schema for Performance Tracking

```sql
-- Store performance records
CREATE TABLE performance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  q_id INT NOT NULL,
  user_id INT NOT NULL,
  language VARCHAR(50) NOT NULL,

  -- Metrics
  avg_cpu_time INT,           -- milliseconds
  avg_wall_time INT,          -- milliseconds
  avg_memory BIGINT,          -- bytes
  max_memory BIGINT,          -- bytes
  total_time INT,             -- milliseconds

  -- Metadata
  test_cases_passed INT,
  test_cases_total INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (q_id) REFERENCES questions(q_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),

  INDEX idx_problem_lang (q_id, language),
  INDEX idx_user_perf (user_id, avg_wall_time)
);

-- Query to get percentile rank
SELECT
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM performance_records WHERE q_id = ?)
FROM performance_records
WHERE q_id = ? AND avg_wall_time > ?;
```

## 🚀 Quick Implementation Checklist

- [ ] Update backend `/api/runtestcases` to capture performance
- [ ] Update backend `/api/checktc` to capture performance
- [ ] Update frontend Output component to display metrics
- [ ] Add performance summary card
- [ ] Create performance_records table (optional)
- [ ] Add percentile calculations (optional)
- [ ] Add performance leaderboard (optional)

## 🎓 Key Takeaways

1. ✅ **Piston DOES provide runtime & memory metrics**
2. ❌ **Piston does NOT provide Big-O complexity analysis**
3. ✅ **You can build LeetCode-style performance display**
4. ⚡ **Implementation is straightforward - data already available!**
5. 📊 **Can add percentile rankings by storing submission data**

## 🔗 References

- [Piston API Documentation](https://github.com/engineer-man/piston)
- [Piston Execute Endpoint](https://piston.readthedocs.io)
- Your project's `piston_docs.md` (lines 294-314)

---

**Bottom Line:** Piston gives you everything you need for runtime and memory metrics. You just need to capture and display them! The data is already there in every response - you're just not using it yet. 🎯
