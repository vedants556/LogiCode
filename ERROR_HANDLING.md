# Error Handling Documentation

## Overview

The LogiCode platform implements **comprehensive error handling** across both frontend and backend to ensure:

- User-friendly error messages
- Automatic retry logic for transient failures
- Graceful degradation
- No disruption to user experience
- Proper logging for debugging

---

## 🎯 Error Handling Strategy

### Multi-Layer Approach

```
User Action
    ↓
[Frontend Validation] ← Catch errors early
    ↓
[API Call with Retry] ← Handle network issues
    ↓
[Backend Processing] ← Server-side validation
    ↓
[Error Response] ← Structured error codes
    ↓
[Frontend Error Handler] ← User-friendly messages
    ↓
[User Notification] ← Clear action items
```

---

## 🔍 Error Types

### 1. Network Errors

**Cause:** Internet connection issues, timeout, DNS failures

**Handling:**

- Automatic retry with exponential backoff
- Queue failed requests for later
- Show "Check your connection" message
- Retry when connection restored

**User Experience:**

```
⚠️ No internet connection
Please check your network and try again.
[Retry Button]
```

### 2. Rate Limit Errors (429)

**Cause:** User exceeded API rate limits

**Handling:**

- Show wait time to user
- Disable action temporarily
- Auto-enable after cooldown
- Progressive warnings

**User Experience:**

```
⏳ Too many requests
Please wait 45 seconds before trying again.
[Countdown Timer]
```

### 3. Authentication Errors (401)

**Cause:** Session expired or invalid token

**Handling:**

- Redirect to login page
- Save current state if possible
- Clear invalid tokens
- Show session expired message

**User Experience:**

```
🔒 Session expired
Your session has expired. Please log in again.
[Login Button]
```

### 4. Access Denied (403)

**Cause:** User blocked due to suspicious activity

**Handling:**

- Show block reason
- Provide contact support option
- Log the block event
- Auto-unblock after cooldown

**User Experience:**

```
🚫 Access temporarily blocked
Your account has been temporarily blocked due to suspicious activity.
Violations will expire in 3 minutes.
[Contact Support]
```

### 5. Validation Errors (400, 413)

**Cause:** Invalid input, payload too large

**Handling:**

- Show specific validation errors
- Highlight problematic fields
- Provide correction guidance
- Don't allow retry without fixing

**User Experience:**

```
❌ Request too large
Your code is too large (150KB). Maximum allowed is 100KB.
Please reduce the code size.
```

### 6. Server Errors (500, 502, 503)

**Cause:** Backend issues, service unavailable

**Handling:**

- Automatic retry (up to 3 times)
- Exponential backoff
- Fallback to cached data if available
- Show maintenance message

**User Experience:**

```
⚡ Server error
We're experiencing technical difficulties. Please try again.
[Retry Button] (retrying automatically in 3s...)
```

---

## 📝 Implementation Details

### Frontend Error Handler (`frontend/src/utils/error-handler.js`)

#### Key Features

1. **Structured Error Classes**

```javascript
class APIError extends Error {
  constructor(message, type, statusCode, response, retryable) {
    // Structured error with all relevant info
  }
}
```

2. **Automatic Error Classification**

```javascript
async function parseAPIError(response) {
  // Automatically classifies errors based on status code
  // Returns user-friendly messages
}
```

3. **Enhanced Fetch with Retry**

```javascript
await fetchWithErrorHandling(url, options, {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 30000,
  onRetry: (attempt, max, error) => {
    console.log(`Retry ${attempt}/${max}`);
  },
});
```

4. **Safe Proctoring Calls**

```javascript
// Never disrupts user experience
await safeProctoringCall(apiCall, fallbackAction);
```

5. **Failed Request Queue**

```javascript
// Queues failed requests for retry when connection restored
failedRequestQueue.add({ fn: apiCall });
```

---

## 🔧 Usage Examples

### Example 1: Code Execution with Error Handling

**Before (No Error Handling):**

```javascript
async function runCode() {
  const response = await fetch("/api/runtestcases", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const data = await response.json();
  return data;
}
```

**Problems:**

- ❌ No timeout
- ❌ No retry on network errors
- ❌ No user-friendly messages
- ❌ Crashes on JSON parse error
- ❌ No distinction between error types

**After (With Error Handling):**

```javascript
async function runCode() {
  try {
    const response = await fetchWithErrorHandling(
      "/api/runtestcases",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      },
      {
        maxRetries: 2,
        retryDelay: 1000,
        timeout: 30000,
        onRetry: (attempt, max, error) => {
          showNotification(`Retrying... (${attempt}/${max})`);
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    const recovery = getErrorRecoveryAction(error);
    showNotification({
      type: "error",
      message: recovery.message,
      action: recovery.action,
      canRetry: recovery.canRetry,
    });
    throw error;
  }
}
```

**Benefits:**

- ✅ 30-second timeout
- ✅ Automatic retry with exponential backoff
- ✅ User-friendly error messages
- ✅ Proper error classification
- ✅ Recovery suggestions

### Example 2: Proctoring Events (Silent Failure)

**Before:**

```javascript
async function logEvent(eventType) {
  await fetch("/api/proctoring/log-event", {
    method: "POST",
    body: JSON.stringify({ eventType }),
  });
}
```

**Problems:**

- ❌ Crashes user experience if fails
- ❌ No retry on network errors
- ❌ Lost events on failure

**After:**

```javascript
async function logEvent(eventType) {
  await safeProctoringCall(
    async () => {
      const response = await fetchWithErrorHandling(
        "/api/proctoring/log-event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType }),
        },
        { maxRetries: 1, timeout: 5000 }
      );
      return await response.json();
    },
    (error) => {
      // Fallback: Queue for later if network error
      if (error.type === ErrorType.NETWORK) {
        failedRequestQueue.add({ fn: () => logEvent(eventType) });
      }
    }
  );
}
```

**Benefits:**

- ✅ Never disrupts user
- ✅ Silent retry
- ✅ Queues for later if offline
- ✅ Processes queue when online

---

## 🎨 User Experience Guidelines

### 1. Error Messages Should Be:

#### ✅ Good Examples

```
"No internet connection. Please check your network."
"Rate limit exceeded. Please wait 30 seconds."
"Your code is too large. Maximum allowed is 100KB."
```

#### ❌ Bad Examples

```
"Error: ECONNREFUSED"
"HTTP 429"
"Request failed"
```

### 2. Always Provide Actions

```
❌ Bad: "An error occurred."

✅ Good: "Server error. Please try again."
         [Retry Button]

✅ Better: "Server error. Retrying automatically..."
           [Progress: 2/3 attempts]
           [Cancel Retry]
```

### 3. Show Progress for Retries

```javascript
onRetry: (attempt, max, error) => {
  showNotification({
    type: "info",
    message: `Connection failed. Retrying... (${attempt}/${max})`,
    progress: (attempt / max) * 100,
  });
};
```

---

## 🚨 Error Handling Checklist

### For Every API Call:

- [ ] Wrap in try-catch block
- [ ] Use `fetchWithErrorHandling` for automatic retry
- [ ] Set appropriate timeout (5-30 seconds)
- [ ] Configure retry strategy (retries, delay)
- [ ] Handle all error types (network, rate limit, etc.)
- [ ] Show user-friendly error messages
- [ ] Provide recovery actions
- [ ] Log errors for debugging
- [ ] Test offline behavior
- [ ] Test rate limit behavior

### For Critical Operations (Code Execution, Submissions):

- [ ] All of the above, plus:
- [ ] Show progress indicator
- [ ] Disable UI during processing
- [ ] Allow cancellation if long-running
- [ ] Save state before operation
- [ ] Restore state on failure
- [ ] Provide detailed error info
- [ ] Log metrics (timing, retries, etc.)

### For Non-Critical Operations (Proctoring, Analytics):

- [ ] Use `safeProctoringCall` for silent failures
- [ ] Queue failed requests
- [ ] Process queue when connection restored
- [ ] Don't disrupt user experience
- [ ] Log failures for monitoring

---

## 📊 Error Monitoring

### What to Monitor:

1. **Error Rates by Type**

   - Network errors (check CDN/connectivity)
   - Rate limit errors (adjust limits)
   - Server errors (check backend health)
   - Validation errors (improve UX)

2. **Failed Request Queue Size**

   - Indicates connectivity issues
   - Monitor for anomalies

3. **Retry Success Rate**

   - Should be > 80%
   - If low, increase retry attempts or delay

4. **User-Facing Error Frequency**
   - Should be < 1% of requests
   - High rate indicates system issues

### Backend Logging

```javascript
// Log errors with context
console.error("API Error:", {
  user: req.user?.userid,
  endpoint: req.path,
  error: error.message,
  statusCode: error.statusCode,
  timestamp: new Date(),
});
```

### Frontend Logging

```javascript
// Log errors for debugging
console.error("Request failed:", {
  url,
  error: error.type,
  message: error.message,
  retries: attempt,
  timestamp: Date.now(),
});
```

---

## 🔄 Error Recovery Flows

### Flow 1: Network Error Recovery

```
User clicks "Run Code"
    ↓
API call fails (network error)
    ↓
Show "Connection issue" message
    ↓
Retry automatically (1st attempt)
    ↓
Still fails?
    ↓
Retry automatically (2nd attempt)
    ↓
Still fails?
    ↓
Add to failed request queue
    ↓
Show "Will retry when online"
    ↓
Connection restored (online event)
    ↓
Process failed request queue
    ↓
✅ Success!
```

### Flow 2: Rate Limit Recovery

```
User spam-clicks "Run Code"
    ↓
Backend returns 429 (rate limit)
    ↓
Show "Too many requests"
    ↓
Show countdown timer (60s)
    ↓
Disable "Run Code" button
    ↓
After 60 seconds...
    ↓
Enable "Run Code" button
    ↓
Show "You can try again now"
    ↓
✅ User can proceed
```

### Flow 3: Auto-Block Recovery

```
User triggers 20+ violations
    ↓
Backend returns 403 (blocked)
    ↓
Show "Account temporarily blocked"
    ↓
Explain violation history
    ↓
Show countdown (5 minutes rolling window)
    ↓
Violations expire after 5 minutes
    ↓
Backend unblocks automatically
    ↓
✅ Access restored
```

---

## 🧪 Testing Error Handling

### Manual Tests

1. **Network Errors**

   ```bash
   # Simulate offline mode
   - Open DevTools → Network → Offline
   - Trigger API calls
   - Verify retry behavior
   - Verify queue mechanism
   - Go online, verify queue processing
   ```

2. **Rate Limits**

   ```bash
   # Trigger rate limit
   - Spam "Run Code" button (10+ clicks)
   - Verify 429 error after 10 requests
   - Verify countdown timer
   - Verify button re-enables after timer
   ```

3. **Server Errors**

   ```bash
   # Simulate server error (backend)
   - Return 500 error for test route
   - Verify automatic retry
   - Verify exponential backoff
   - Verify user notification
   ```

4. **Validation Errors**
   ```bash
   # Trigger validation error
   - Submit code > 100KB
   - Verify 413 error
   - Verify user-friendly message
   - Verify no retry attempt
   ```

### Automated Tests

```javascript
// Test error classification
test("should classify 429 as rate limit error", async () => {
  const response = { status: 429, json: async () => ({}) };
  const error = await parseAPIError(response);
  expect(error.type).toBe(ErrorType.RATE_LIMIT);
  expect(error.retryable).toBe(true);
});

// Test retry logic
test("should retry on network error", async () => {
  let attempts = 0;
  const mockFn = jest.fn(() => {
    attempts++;
    if (attempts < 3) throw new Error("Network error");
    return { ok: true };
  });

  await fetchWithErrorHandling(mockFn, {}, { maxRetries: 3 });
  expect(attempts).toBe(3);
});
```

---

## 📚 Summary

### Error Handling Features

✅ **Automatic retry** with exponential backoff  
✅ **Failed request queue** for offline scenarios  
✅ **User-friendly messages** for all error types  
✅ **Silent failures** for non-critical operations  
✅ **Recovery suggestions** with clear actions  
✅ **Progress indicators** for retries  
✅ **Error classification** by type  
✅ **Timeout protection** for all requests  
✅ **Graceful degradation** when services fail

### Developer Guidelines

1. **Always use `fetchWithErrorHandling`** for API calls
2. **Use `safeProctoringCall`** for non-critical operations
3. **Provide user-friendly error messages**
4. **Show recovery actions** (Retry, Login, etc.)
5. **Queue failed requests** for later processing
6. **Test error scenarios** thoroughly
7. **Monitor error rates** and types
8. **Log errors** with context for debugging

### User Experience

✅ Clear, actionable error messages  
✅ Automatic recovery when possible  
✅ Progress indication during retries  
✅ No disruption for non-critical failures  
✅ Graceful handling of all error types

---

**Status:** ✅ Comprehensive error handling implemented and tested

_Last Updated: January 2025_
