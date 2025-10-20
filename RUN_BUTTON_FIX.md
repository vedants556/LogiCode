# Run Button Fix - LeetCode-Style Testing 🔧

## 🐛 The Problem:

When users clicked the "Run" button on the Problem page, they got this error:

```
/usr/bin/ld: /usr/lib/x86_64-linux-gnu/crt1.o: in function `_start':
(.text+0x20): undefined reference to `main'
collect2: error: ld returned 1 exit status
```

### Why This Happened:

The Run button was trying to compile and execute the user's code directly (just the function), without combining it with the test runner code from the database. This caused a linker error because there was no `main()` function.

---

## ✅ The Solution: LeetCode-Style Testing

### The Correct Workflow (Like LeetCode):

1. **Run Button**: Combines user code + test runner code → Shows results for ALL test cases
2. **Submit Button**: Combines user code + test runner code → Validates and marks as solved

Both buttons now work the same way - they combine the user's code with test runner code!

### What Was Implemented:

#### Frontend Changes (`Output.jsx`):

Updated `exec()` function to call a new API endpoint that runs test cases:

```javascript
async function exec() {
  // Call new /api/runtestcases endpoint
  const response = await fetch("/api/runtestcases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      usercode: props.code,
      qid: props.qid,
      language: props.language || "c",
    }),
  });

  const data = await response.json();

  // Display results for each test case
  data.results.forEach((result, index) => {
    console.log(`Test Case ${index + 1}:`);
    console.log(`Input: ${result.input}`);
    console.log(`Expected: ${result.expected}`);
    console.log(`Your Output: ${result.actual}`);
    console.log(`Status: ${result.passed ? "✅ PASS" : "❌ FAIL"}`);
  });
}
```

#### Backend Changes (`index.js`):

Created new `/api/runtestcases` endpoint:

```javascript
app.post("/api/runtestcases", async (req, res) => {
  const { usercode, qid, language } = req.body;

  // Get test cases from database
  const testcases = await getTestCases(qid);
  const results = [];

  // Run code against each test case
  for (const testc of testcases) {
    // Combine user code + test runner code
    const fileContent = usercode + "\n" + testc.runnercode;

    // Execute via Piston API
    const data = await executePiston(fileContent, language);

    // Compare output
    results.push({
      input: testc.ip,
      expected: testc.op,
      actual: data.run.stdout,
      passed: data.run.stdout.trim() === testc.op.trim(),
      error: data.run.stderr || null,
    });
  }

  res.json({ results });
});
```

---

## 🎯 New User Experience:

### Scenario 1: Run Button (Show Results)

**User's Code:**

```c
int addNumbers(int a, int b) {
    return a + b;
}
```

**Click "Run" → Output:**

```
Test Case 1:
Input: 5 3
Expected: 8
Your Output: 8
Status: ✅ PASS

Test Case 2:
Input: -2 7
Expected: 5
Your Output: 5
Status: ✅ PASS

Test Case 3:
Input: 0 0
Expected: 0
Your Output: 0
Status: ✅ PASS
```

### Scenario 2: Run Button (With Error)

**User's Code:**

```c
int addNumbers(int a, int b) {
    return a - b;  // Wrong logic!
}
```

**Click "Run" → Output:**

```
Test Case 1:
Input: 5 3
Expected: 8
Your Output: 2
Status: ❌ FAIL

Test Case 2:
Input: -2 7
Expected: 5
Your Output: -9
Status: ❌ FAIL
```

### Scenario 3: Compilation Error

**User's Code:**

```c
int addNumbers(int a, int b) {
    return a + b  // Missing semicolon
}
```

**Click "Run" → Output:**

```
Test Case 1:
Input: 5 3
Expected: 8
Your Output:
Status: ❌ FAIL
Error: expected ';' before '}' token
```

---

## 📊 Before vs After:

| Aspect                   | Before ❌                    | After ✅                          |
| ------------------------ | ---------------------------- | --------------------------------- |
| **Run button**           | Tried to run incomplete code | Runs with test runner code        |
| **Error messages**       | Cryptic linker errors        | Clear test results                |
| **Test case visibility** | Not shown                    | All test cases shown with results |
| **Workflow**             | Confusing                    | Like LeetCode (intuitive)         |
| **User testing**         | Had to submit to test        | Can test before submitting        |

---

## 🔑 Key Improvements:

1. **LeetCode-Style Testing**: Run button now works exactly like LeetCode
2. **See All Results**: Users see results for ALL test cases when they run
3. **Test Before Submit**: Users can test their code without submitting
4. **Clear Feedback**: Each test case shows pass/fail status
5. **No More Errors**: No more "undefined reference to main" errors

---

## 💡 The Workflow:

### For Users:

1. **Write Code** → Write your function implementation
2. **Click "Run"** → See results for all test cases ✅ (Quick testing)
3. **Fix Issues** → See which test cases failed
4. **Click "Submit"** → Marks problem as solved and saves to database

### Difference Between Run and Submit:

| Action                        | Run            | Submit                    |
| ----------------------------- | -------------- | ------------------------- |
| **Combines with runner code** | ✅ Yes         | ✅ Yes                    |
| **Shows test results**        | ✅ All results | ❌ Stops at first failure |
| **Marks as solved**           | ❌ No          | ✅ Yes                    |
| **Updates database**          | ❌ No          | ✅ Yes                    |
| **Use case**                  | Quick testing  | Final submission          |

---

## 📁 Files Changed:

1. **frontend/src/components/Output.jsx**

   - Lines 172-227: Rewrote `exec()` function
   - Now calls `/api/runtestcases` endpoint
   - Displays results for all test cases

2. **backend/index.js**
   - Lines 660-754: Added new `/api/runtestcases` endpoint
   - Runs code against all test cases
   - Returns detailed results array

---

## ✅ Testing:

### Test 1: Correct Solution

1. Write correct function
2. Click "Run"
3. **Expected**: All test cases show ✅ PASS

### Test 2: Wrong Logic

1. Write incorrect function
2. Click "Run"
3. **Expected**: Failed test cases show ❌ FAIL with expected vs actual

### Test 3: Compilation Error

1. Write code with syntax error
2. Click "Run"
3. **Expected**: Error message shown for each test case

### Test 4: Submit After Testing

1. Click "Run" → See all pass
2. Click "Submit" → Problem marked as solved
3. **Expected**: Works correctly

---

## 🎉 Result:

The Run button now works **exactly like LeetCode**:

- ✅ Combines user code with test runner code
- ✅ Shows results for ALL test cases
- ✅ Clear pass/fail indicators
- ✅ Users can test before submitting
- ✅ No more cryptic linker errors
- ✅ Intuitive workflow

**The Key Difference:**

- **Run**: Shows all results (for testing)
- **Submit**: Validates and marks as solved (for completion)

This is how modern coding platforms work! 🚀
