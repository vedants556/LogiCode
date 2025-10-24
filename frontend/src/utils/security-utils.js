/**
 * Security Utilities for Frontend
 *
 * Provides throttling and debouncing to prevent spam and reduce API calls
 */

/**
 * Throttle function - limits function calls to once per specified time period
 * Use for events that fire frequently (scroll, resize, mousemove, etc.)
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  let lastResult;

  return function (...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * Debounce function - delays function execution until after specified time
 * has passed since last call. Use for events like typing, search input, etc.
 *
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Rate limiter for API calls
 * Tracks calls and prevents exceeding specified rate
 *
 * @param {number} maxCalls - Maximum calls allowed
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Object} Rate limiter with check and canCall methods
 */
export function createRateLimiter(maxCalls, timeWindow) {
  const calls = [];

  return {
    canCall() {
      const now = Date.now();

      // Remove calls outside the time window
      while (calls.length > 0 && calls[0] < now - timeWindow) {
        calls.shift();
      }

      // Check if we can make another call
      if (calls.length < maxCalls) {
        calls.push(now);
        return true;
      }

      return false;
    },

    getRemainingCalls() {
      const now = Date.now();

      // Remove calls outside the time window
      while (calls.length > 0 && calls[0] < now - timeWindow) {
        calls.shift();
      }

      return maxCalls - calls.length;
    },

    getResetTime() {
      if (calls.length === 0) return 0;
      const now = Date.now();
      return Math.max(0, calls[0] + timeWindow - now);
    },
  };
}

/**
 * Event deduplicator - prevents duplicate events within a time window
 * Use to prevent multiple identical API calls
 *
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Object} Deduplicator with check method
 */
export function createEventDeduplicator(timeWindow = 1000) {
  const events = new Map();

  return {
    isDuplicate(eventKey) {
      const now = Date.now();

      if (events.has(eventKey)) {
        const lastTime = events.get(eventKey);
        if (now - lastTime < timeWindow) {
          return true; // Duplicate event
        }
      }

      events.set(eventKey, now);

      // Cleanup old entries
      if (events.size > 100) {
        const cutoff = now - timeWindow;
        for (const [key, time] of events.entries()) {
          if (time < cutoff) {
            events.delete(key);
          }
        }
      }

      return false;
    },
  };
}

/**
 * Proctoring event throttler
 * Specialized throttler for proctoring events with different limits per event type
 */
export class ProctoringEventThrottler {
  constructor() {
    // Different rate limits for different event types
    this.limits = {
      right_click_attempt: createRateLimiter(10, 60000), // 10 per minute
      tab_switch: createRateLimiter(15, 60000), // 15 per minute
      window_blur: createRateLimiter(15, 60000), // 15 per minute
      devtools_attempt: createRateLimiter(5, 60000), // 5 per minute
      copy: createRateLimiter(20, 60000), // 20 per minute
      paste: createRateLimiter(20, 60000), // 20 per minute
      copy_attempt_blocked: createRateLimiter(10, 60000), // 10 per minute
    };

    this.deduplicator = createEventDeduplicator(1000); // 1 second dedup window
  }

  /**
   * Check if an event can be logged
   * @param {string} eventType - Type of proctoring event
   * @param {string} eventDetails - Event details for deduplication
   * @returns {Object} { allowed: boolean, reason: string }
   */
  canLogEvent(eventType, eventDetails = "") {
    // Check for duplicates first
    const dedupKey = `${eventType}-${eventDetails}`;
    if (this.deduplicator.isDuplicate(dedupKey)) {
      return {
        allowed: false,
        reason: "duplicate",
        message: "Duplicate event within 1 second",
      };
    }

    // Check rate limit for this event type
    const limiter = this.limits[eventType] || this.limits.right_click_attempt;
    if (!limiter.canCall()) {
      const resetTime = limiter.getResetTime();
      return {
        allowed: false,
        reason: "rate_limit",
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          resetTime / 1000
        )}s`,
        resetTime,
      };
    }

    return { allowed: true };
  }

  /**
   * Get remaining calls for an event type
   * @param {string} eventType - Type of proctoring event
   * @returns {number} Remaining calls allowed
   */
  getRemainingCalls(eventType) {
    const limiter = this.limits[eventType] || this.limits.right_click_attempt;
    return limiter.getRemainingCalls();
  }
}

/**
 * Create a throttled version of an async function that logs proctoring events
 * @param {Function} logFunction - The logging function to throttle
 * @param {number} minInterval - Minimum interval between calls in ms
 * @returns {Function} Throttled version of the function
 */
export function createThrottledLogger(logFunction, minInterval = 1000) {
  let lastCall = 0;
  let pendingCall = null;

  return async function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= minInterval) {
      // Enough time has passed, execute immediately
      lastCall = now;
      if (pendingCall) {
        clearTimeout(pendingCall);
        pendingCall = null;
      }
      return await logFunction(...args);
    } else {
      // Too soon, schedule for later
      if (pendingCall) {
        clearTimeout(pendingCall);
      }

      return new Promise((resolve) => {
        pendingCall = setTimeout(async () => {
          lastCall = Date.now();
          pendingCall = null;
          const result = await logFunction(...args);
          resolve(result);
        }, minInterval - timeSinceLastCall);
      });
    }
  };
}

export default {
  throttle,
  debounce,
  createRateLimiter,
  createEventDeduplicator,
  ProctoringEventThrottler,
  createThrottledLogger,
};
