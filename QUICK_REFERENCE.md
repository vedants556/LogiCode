# Test Case Validation - Quick Reference Card 🚀

## 📦 What Changed:

### Frontend API Call:

**OLD:**

```javascript
{
  code: combinedCode,  // ❌ Combined on frontend
  op: expectedOutput,
  ip: input,
  language: "c"
}
```

**NEW:**

```javascript
{
  solutionCode: "int add(int a, int b) { return a + b; }",
  runnerCode: "int main() { printf(\"%d\", add(5,3)); return 0; }",
  expectedOutput: "8",
  input: "",  // Optional
  language: "c"
}
```

### Backend Response:

**OLD:**

```javascript
{
  status: "valid" | "invalid",
  error: "string"  // Generic
}
```

**NEW:**

```javascript
// Success:
{ status: "valid", actualOutput: "8", expectedOutput: "8" }

// Compilation Error:
{ status: "invalid", compilationError: "detailed error" }

// Runtime Error:
{ status: "invalid", error: "detailed error" }

// Output Mismatch:
{ status: "invalid", mismatch: true, actualOutput: "8", expectedOutput: "10" }
```

---

## 🎯 Quick Test Examples:

### C Example:

```c
// Solution Code (in solution editor):
#include <stdio.h>
int add(int a, int b) { return a + b; }

// Test Case:
Expected Output: 8
Driver Code:
int main() {
    printf("%d", add(5, 3));
    return 0;
}
```

### Python Example:

```python
# Solution Code:
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Test Case:
Expected Output: 120
Driver Code:
if __name__ == "__main__":
    print(factorial(5))
```

---

## ⚡ Validation Flow:

```
User fills form
    ↓
Frontend validates (empty fields, function name, etc.)
    ↓
Sends {solutionCode, runnerCode, expectedOutput, input, language}
    ↓
Backend combines code based on language
    ↓
Backend executes via Piston API
    ↓
Backend checks: compilation → runtime → output
    ↓
Backend returns detailed result
    ↓
Frontend shows: ✅ Valid or ❌ Error with details
```

---

## 🔑 Key Points:

1. **Input is optional** - Only needed if driver code reads from stdin
2. **Expected output must match exactly** - Character-by-character comparison
3. **Function must be called in driver code** - Validation checks this
4. **Solution code separate from driver code** - Backend combines them
5. **Can't save until valid** - Save button disabled until ✅
6. **Form resets after save** - Ready for next test case

---

## 🐛 Common Issues & Solutions:

| Issue                     | Cause                        | Solution                                        |
| ------------------------- | ---------------------------- | ----------------------------------------------- |
| IndentationError (Python) | Wrong indentation            | Use 0 spaces for `if __name__`, 4 spaces inside |
| Compilation Error (C)     | Missing headers              | Add `#include <stdio.h>` in solution code       |
| Output Mismatch           | Wrong expected output        | Check exact output (no extra spaces/newlines)   |
| Function not found        | Driver doesn't call function | Add function call in driver code                |
| Save button disabled      | Not validated yet            | Click "Check Test Case" first                   |

---

## 📖 Files Modified:

1. `frontend/src/pages/AddQuestion.jsx` - Complete validation rewrite
2. `frontend/src/pages/AddQuestion.css` - New status styles
3. `backend/index.js` - `/api/tcvalid` endpoint rewrite

## 📚 Documentation:

1. `FIXES_SUMMARY.md` - Complete technical details
2. `test_examples_corrected.md` - User testing guide
3. `QUICK_REFERENCE.md` - This file (quick ref)

---

## ✅ Testing Checklist:

- [ ] Empty expected output → Shows error
- [ ] Empty driver code → Shows error
- [ ] Missing function name → Shows error
- [ ] Function not called → Shows error
- [ ] Valid C test case → Shows ✅ Valid
- [ ] Valid Python test case → Shows ✅ Valid
- [ ] Wrong output → Shows ❌ Mismatch
- [ ] Compilation error → Shows ❌ Compilation Error
- [ ] Save button disabled → Until validated
- [ ] Form resets → After successful save

---

**Need more details?** Check `FIXES_SUMMARY.md` or `test_examples_corrected.md`
