# Test Case Validation Examples - CORRECTED ✅

The code execution logic has been completely rewritten. Here's how it works now:

## 🔧 How The System Works:

1. **Solution Code** = Your function implementation (stored separately in the solution editor)
2. **Driver Code** = Code that calls your function and prints output to stdout
3. **System automatically combines** Solution Code + Driver Code = Complete program
4. **Input** = Optional stdin data (only if your driver code reads from stdin)
5. **Expected Output** = Exact text that should appear in stdout (must match exactly)

---

## Example 1: Simple Addition Function (C) ✅

### Setup:

**Function Name:** `add`

**Solution Code:**

```c
int add(int a, int b) {
    return a + b;
}
```

### Test Case 1:

- **Input:** _(leave empty)_
- **Expected Output:** `8`
- **Driver Code:**

```c
int main() {
    int result = add(5, 3);
    printf("%d", result);
    return 0;
}
```

### Test Case 2:

- **Input:** _(leave empty)_
- **Expected Output:** `5`
- **Driver Code:**

```c
int main() {
    int result = add(-2, 7);
    printf("%d", result);
    return 0;
}
```

**⚠️ Important:** Don't include `\n` in expected output unless your printf includes it!

---

## Example 2: Sum of Two Numbers (C) ✅

### Setup:

**Function Name:** `sum`

**Solution Code:**

```c
#include <stdio.h>

int sum(int a, int b) {
    return a + b;
}
```

### Test Case:

- **Input:** _(leave empty)_
- **Expected Output:** `15`
- **Driver Code:**

```c
int main() {
    printf("%d", sum(7, 8));
    return 0;
}
```

---

## Example 3: Python Factorial Function ✅

### Setup:

**Function Name:** `factorial`

**Solution Code:**

```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
```

### Test Case 1:

- **Input:** _(leave empty)_
- **Expected Output:** `120`
- **Driver Code:**

```python
if __name__ == "__main__":
    result = factorial(5)
    print(result)
```

### Test Case 2:

- **Input:** _(leave empty)_
- **Expected Output:** `1`
- **Driver Code:**

```python
if __name__ == "__main__":
    result = factorial(0)
    print(result)
```

**✅ Python Tips:**

- The `if __name__ == "__main__":` should have NO indentation
- Code inside the block should be indented with 4 spaces
- Use `print(result)` NOT `print(result, end="")`

---

## Example 4: C++ String Function ✅

### Setup:

**Function Name:** `reverseString`

**Solution Code:**

```cpp
#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

string reverseString(string str) {
    reverse(str.begin(), str.end());
    return str;
}
```

### Test Case:

- **Input:** _(leave empty)_
- **Expected Output:** `olleh`
- **Driver Code:**

```cpp
int main() {
    cout << reverseString("hello");
    return 0;
}
```

---

## Example 5: Reading from stdin (C) ✅

### Setup:

**Function Name:** `addNumbers`

**Solution Code:**

```c
#include <stdio.h>

int addNumbers(int a, int b) {
    return a + b;
}
```

### Test Case:

- **Input:** `5 3` _(this will be passed to stdin)_
- **Expected Output:** `8`
- **Driver Code:**

```c
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d", addNumbers(a, b));
    return 0;
}
```

---

## 🧪 Testing Workflow:

### Step 1: Fill Basic Info

1. Enter **Problem Name**
2. Select **Problem Type**
3. Enter **Function Name** (e.g., `add`)

### Step 2: Add Solution Code

1. Write your function in the **Solution Code** editor
2. Make sure it includes necessary headers (for C/C++)

### Step 3: Create Test Case

1. **Input**: Leave empty (unless you need stdin)
2. **Expected Output**: Type exactly what should print (e.g., `8`)
3. **Driver Code**: Write code that calls your function and prints result
4. Click **"Check Test Case"**
5. Wait for validation (should show ✅ Valid or ❌ Invalid with error)
6. Click **"Save Test Case"** (only enabled when valid)

---

## ❌ Common Mistakes vs ✅ Correct Way:

### Mistake 1: Wrong Expected Output

❌ **Wrong:** Expected output = `8\n`
✅ **Correct:** Expected output = `8`
(Unless your printf actually prints the newline)

### Mistake 2: Function Not Called

❌ **Wrong Driver Code:**

```c
int main() {
    printf("8");  // Hardcoded!
    return 0;
}
```

✅ **Correct Driver Code:**

```c
int main() {
    printf("%d", add(5, 3));  // Calls the function!
    return 0;
}
```

### Mistake 3: Missing Headers in Solution

❌ **Wrong Solution Code:**

```c
int add(int a, int b) {
    return a + b;
}
```

✅ **Correct Solution Code:**

```c
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}
```

### Mistake 4: Python Indentation

❌ **Wrong:**

```python
    if __name__ == "__main__":  # Indented!
        print(factorial(5))
```

✅ **Correct:**

```python
if __name__ == "__main__":  # No indentation!
    print(factorial(5))
```

---

## 🎯 What Gets Validated:

1. ✅ **Solution code compiles** (no syntax errors)
2. ✅ **Driver code compiles** (no syntax errors)
3. ✅ **Combined code runs** (no runtime errors)
4. ✅ **Output matches exactly** (character-by-character comparison)

---

## 💡 Pro Tips:

1. **Start simple** - Test with basic functions first
2. **Check compilation** - Make sure your code compiles before testing
3. **Exact matching** - Expected output must match EXACTLY (including spaces)
4. **No extra output** - Don't print anything extra in driver code
5. **Test locally first** - Run your code locally to verify it works
6. **Multiple test cases** - Add at least 2-3 test cases per problem

---

## 🚀 Quick Start Template:

### C Template:

```c
// Solution Code:
#include <stdio.h>

int myFunction(int x) {
    // Your logic here
    return x * 2;
}

// Driver Code:
int main() {
    printf("%d", myFunction(5));
    return 0;
}
```

### Python Template:

```python
# Solution Code:
def myFunction(x):
    # Your logic here
    return x * 2

# Driver Code:
if __name__ == "__main__":
    print(myFunction(5))
```

---

This corrected guide should help you successfully test the improved validation system! 🎉
