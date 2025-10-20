# Timer Auto-Submit Feature

## Overview

The timer auto-submit feature automatically submits a user's code when the time limit expires, ensuring fair competition and preventing users from working beyond the allocated time.

## How It Works

### 1. Timer Initialization

- When a problem has a timer set (in minutes), the countdown begins automatically
- Timer is displayed in the top-right corner with a pulsing animation
- Timer shows format: `MM:SS` (minutes:seconds)

### 2. Visual Warnings

- **Normal State**: Orange/red timer display with gentle pulse
- **Warning State** (≤ 1 minute):
  - Timer turns bright red with urgent pulsing
  - Warning text appears: "⚠️ Less than 1 minute remaining!"
  - More aggressive visual feedback

### 3. Auto-Submit Process

When timer reaches 0:

1. **Notification**: Shows "⏰ Time is up! Your code will be submitted automatically."
2. **Auto-Submit**: After 3 seconds, automatically submits the current code
3. **Submission Logic**: Uses the same logic as manual submit button:
   - **Test Case Problems**: Calls `/api/checktc` endpoint
   - **AI Problems**: Calls `/api/checkbyai` endpoint
4. **Result Notification**: Shows success/failure message

## Technical Implementation

### Frontend Changes (`Problem.jsx`)

```javascript
// Timer countdown effect
useEffect(() => {
  if (timer && timeLeft !== null && timeLeft > 0) {
    timerInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timerInterval.current);
          handleAutoSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  return () => clearInterval(timerInterval.current);
}, [timer, timeLeft]);

// Auto-submit function
async function handleAutoSubmit() {
  // Show notification
  setNotificationMessage(
    "⏰ Time is up! Your code will be submitted automatically."
  );
  setShowNotification(true);

  // Auto-submit after 3 seconds
  setTimeout(async () => {
    // Submit logic based on problem type (testcase vs AI)
    // ... submission logic
  }, 3000);
}
```

### CSS Styling (`Problem.css`)

```css
/* Timer warning styles */
.timer-warning {
  background: rgba(255, 0, 0, 0.2) !important;
  border: 2px solid #ff0000 !important;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.5) !important;
  animation: urgent-pulse 0.5s infinite !important;
}

@keyframes urgent-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
```

## User Experience

### Timer States

1. **Normal Countdown**: Standard timer display
2. **Warning State** (≤ 60 seconds):
   - Red urgent styling
   - Warning message
   - Faster pulsing animation
3. **Auto-Submit**:
   - Notification overlay
   - Automatic submission
   - Result feedback

### Benefits

- **Fair Competition**: Ensures all users have the same time limit
- **Prevents Cheating**: No way to work beyond allocated time
- **Clear Feedback**: Users know exactly when time is up
- **Automatic**: No manual intervention required

## Testing Scenarios

### Test Case 1: Normal Timer

1. Set problem with 5-minute timer
2. Start coding
3. Timer counts down normally
4. At 1 minute: warning appears
5. At 0: auto-submit triggers

### Test Case 2: No Timer

1. Set problem with no timer (0 minutes)
2. Timer should not appear
3. No auto-submit functionality

### Test Case 3: Manual Submit Before Timer

1. User submits manually before timer expires
2. Timer should stop
3. No auto-submit should occur

## Configuration

### Setting Timer in AddQuestion

```javascript
// In AddQuestion.jsx
questionData.timer = timerRef.current ? parseInt(timerRef.current.value) : 0; // 0 means no timer
```

### Backend Timer Storage

- Timer is stored in `questions` table as `timer` field (in minutes)
- Frontend converts to seconds for countdown
- 0 or null means no timer

## Error Handling

- Network errors during auto-submit are caught and logged
- User gets notification if auto-submit fails
- Timer continues to work even if auto-submit fails
- Graceful fallback to manual submission

## Future Enhancements

- **Pause Timer**: Allow pausing timer for breaks
- **Time Extensions**: Admin can extend time if needed
- **Multiple Warnings**: 5-minute, 1-minute, 30-second warnings
- **Sound Alerts**: Audio notifications for warnings
- **Progress Bar**: Visual progress bar showing time remaining
