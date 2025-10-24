/**
 * Security Middleware for LogiCode Platform
 *
 * This module provides comprehensive security measures including:
 * - Rate limiting for API endpoints
 * - Request throttling and debouncing
 * - Event batching for proctoring logs
 * - Suspicious activity detection
 * - Request validation
 */

import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// ============================================================
// RATE LIMITING CONFIGURATIONS
// ============================================================

/**
 * Strict rate limiter for expensive operations (code execution)
 * Limits: 10 requests per minute per user
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: "Too many requests. Please wait before trying again.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP + user ID for more precise limiting
  keyGenerator: (req) => {
    return `${req.ip}-${req.user?.userid || "anonymous"}`;
  },
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: "Too many requests. Please slow down.",
      retryAfter: 60,
      message:
        "You are making requests too quickly. Please wait a minute and try again.",
    });
  },
});

/**
 * Moderate rate limiter for proctoring events
 * Limits: 30 requests per minute per user
 */
export const proctoringRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: "Too many proctoring events. Please reduce activity.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `proctoring-${req.ip}-${req.user?.userid || "anonymous"}`;
  },
  handler: (req, res) => {
    console.warn(
      `⚠️ Proctoring rate limit exceeded for user ${req.user?.userid} (${req.ip})`
    );

    // Log suspicious activity
    logSuspiciousActivity(
      req.user?.userid,
      req.ip,
      "proctoring_spam",
      "User exceeded proctoring event rate limit"
    );

    res.status(429).json({
      error: "Too many proctoring events detected.",
      message:
        "Please solve problems normally. Excessive events are being logged.",
    });
  },
});

/**
 * Standard rate limiter for general API endpoints
 * Limits: 100 requests per minute per user
 */
export const standardRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.user?.userid || "anonymous"}`;
  },
});

/**
 * Speed limiter - gradually slows down requests
 * Starts delaying after 5 requests, adds 500ms delay per request
 */
export const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 5, // Allow 5 requests per minute at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 10000, // Maximum delay of 10 seconds
  keyGenerator: (req) => {
    return `speed-${req.ip}-${req.user?.userid || "anonymous"}`;
  },
});

// ============================================================
// EVENT BATCHING SYSTEM
// ============================================================

// In-memory batch storage
const eventBatches = new Map();
const BATCH_INTERVAL = 5000; // Flush every 5 seconds
const MAX_BATCH_SIZE = 50; // Flush if batch reaches 50 events

/**
 * Batch proctoring events to reduce database writes
 * Instead of writing each event immediately, collect them and write in bulk
 */
export function batchProctoringEvent(
  userId,
  qId,
  eventType,
  eventDetails,
  severity
) {
  const key = `${userId}-${qId}`;

  if (!eventBatches.has(key)) {
    eventBatches.set(key, []);
  }

  const batch = eventBatches.get(key);
  batch.push({
    userId,
    qId,
    eventType,
    eventDetails,
    severity,
    timestamp: new Date(),
  });

  // Flush if batch is too large
  if (batch.length >= MAX_BATCH_SIZE) {
    flushBatch(key);
  }
}

/**
 * Flush event batch to database
 */
function flushBatch(key) {
  const batch = eventBatches.get(key);
  if (!batch || batch.length === 0) return;

  // This will be called from index.js with db connection
  if (global.flushProctoringBatch) {
    global.flushProctoringBatch(batch);
  }

  eventBatches.delete(key);
}

/**
 * Start periodic batch flushing
 */
export function startBatchFlushing() {
  setInterval(() => {
    for (const key of eventBatches.keys()) {
      flushBatch(key);
    }
  }, BATCH_INTERVAL);

  console.log("✅ Event batching system started (flush every 5s)");
}

// ============================================================
// EVENT DEDUPLICATION & THROTTLING
// ============================================================

// Track recent events to prevent duplicates
const recentEvents = new Map();
const EVENT_DEDUP_WINDOW = 1000; // 1 second deduplication window

/**
 * Check if an event is a duplicate (same event within 1 second)
 */
export function isDuplicateEvent(userId, eventType, eventDetails) {
  const key = `${userId}-${eventType}-${eventDetails}`;
  const now = Date.now();

  if (recentEvents.has(key)) {
    const lastTime = recentEvents.get(key);
    if (now - lastTime < EVENT_DEDUP_WINDOW) {
      return true; // Duplicate event, ignore
    }
  }

  recentEvents.set(key, now);

  // Cleanup old entries periodically
  if (recentEvents.size > 1000) {
    cleanupRecentEvents();
  }

  return false;
}

function cleanupRecentEvents() {
  const now = Date.now();
  for (const [key, timestamp] of recentEvents.entries()) {
    if (now - timestamp > EVENT_DEDUP_WINDOW * 2) {
      recentEvents.delete(key);
    }
  }
}

// ============================================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================================

// Track suspicious activity per user
const suspiciousActivity = new Map();
const SUSPICIOUS_THRESHOLD = 10; // 10 violations = suspicious
const BLOCK_THRESHOLD = 20; // 20 violations = auto-block
const ACTIVITY_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * Log suspicious activity and potentially block user
 */
function logSuspiciousActivity(userId, ip, activityType, details) {
  if (!userId) return;

  const key = `${userId}-${ip}`;
  const now = Date.now();

  if (!suspiciousActivity.has(key)) {
    suspiciousActivity.set(key, []);
  }

  const activities = suspiciousActivity.get(key);
  activities.push({
    type: activityType,
    details,
    timestamp: now,
  });

  // Remove old activities
  const recentActivities = activities.filter(
    (a) => now - a.timestamp < ACTIVITY_WINDOW
  );
  suspiciousActivity.set(key, recentActivities);

  // Check thresholds
  if (recentActivities.length >= BLOCK_THRESHOLD) {
    console.error(
      `🚨 AUTO-BLOCKING USER ${userId} (IP: ${ip}) - ${recentActivities.length} violations in 5 minutes`
    );
    // Could implement actual blocking here (add to blocked_users table)
    return "blocked";
  } else if (recentActivities.length >= SUSPICIOUS_THRESHOLD) {
    console.warn(
      `⚠️ SUSPICIOUS USER ${userId} (IP: ${ip}) - ${recentActivities.length} violations`
    );
    return "suspicious";
  }

  return "normal";
}

/**
 * Check if user is suspicious or blocked
 */
export function checkUserStatus(userId, ip) {
  const key = `${userId}-${ip}`;
  const now = Date.now();

  if (!suspiciousActivity.has(key)) {
    return "normal";
  }

  const activities = suspiciousActivity.get(key);
  const recentActivities = activities.filter(
    (a) => now - a.timestamp < ACTIVITY_WINDOW
  );

  if (recentActivities.length >= BLOCK_THRESHOLD) {
    return "blocked";
  } else if (recentActivities.length >= SUSPICIOUS_THRESHOLD) {
    return "suspicious";
  }

  return "normal";
}

/**
 * Middleware to block suspicious users
 */
export function blockSuspiciousUsers(req, res, next) {
  if (!req.user) {
    return next();
  }

  const status = checkUserStatus(req.user.userid, req.ip);

  if (status === "blocked") {
    console.error(
      `🚫 Blocked request from user ${req.user.userid} (${req.ip})`
    );
    return res.status(403).json({
      error: "Access denied",
      message:
        "Your account has been temporarily blocked due to suspicious activity. Please contact support.",
    });
  }

  next();
}

// ============================================================
// REQUEST VALIDATION
// ============================================================

/**
 * Validate request size to prevent large payload attacks
 */
export function validateRequestSize(maxSize = 1024 * 1024) {
  // Default 1MB
  return (req, res, next) => {
    const contentLength = req.headers["content-length"];

    if (contentLength && parseInt(contentLength) > maxSize) {
      console.warn(
        `⚠️ Request too large: ${contentLength} bytes from ${req.ip}`
      );
      return res.status(413).json({
        error: "Request too large",
        message: "The request payload is too large. Maximum size is 1MB.",
      });
    }

    next();
  };
}

/**
 * Validate code submission to prevent malicious code
 */
export function validateCodeSubmission(req, res, next) {
  const { usercode, code } = req.body;
  const codeToValidate = usercode || code;

  if (!codeToValidate) {
    return next();
  }

  // Check for excessively long code (potential attack)
  if (codeToValidate.length > 100000) {
    // 100KB limit for code
    console.warn(
      `⚠️ Code too large: ${codeToValidate.length} chars from user ${req.user?.userid}`
    );
    return res.status(413).json({
      error: "Code too large",
      message: "Your code is too large. Maximum size is 100KB.",
    });
  }

  // Check for suspicious patterns (optional - can be extended)
  const suspiciousPatterns = [
    /while\s*\(\s*true\s*\)/gi, // Infinite loops
    /for\s*\(\s*;\s*;\s*\)/gi, // Infinite loops
    /os\.(system|exec|popen)/gi, // OS command execution (Python)
    /__import__\s*\(\s*['"]os['"]\s*\)/gi, // OS import (Python)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(codeToValidate)) {
      console.warn(
        `⚠️ Suspicious code pattern detected from user ${req.user?.userid}`
      );
      logSuspiciousActivity(
        req.user?.userid,
        req.ip,
        "suspicious_code",
        `Detected pattern: ${pattern}`
      );
      // Don't block, just log - could be legitimate code
    }
  }

  next();
}

// ============================================================
// EXPORT SECURITY STATS
// ============================================================

/**
 * Get security statistics for monitoring
 */
export function getSecurityStats() {
  const now = Date.now();
  const stats = {
    eventBatches: {
      count: eventBatches.size,
      totalEvents: Array.from(eventBatches.values()).reduce(
        (sum, batch) => sum + batch.length,
        0
      ),
    },
    suspiciousUsers: {
      total: suspiciousActivity.size,
      blocked: 0,
      suspicious: 0,
    },
    recentEvents: recentEvents.size,
  };

  // Count blocked/suspicious users
  for (const [key, activities] of suspiciousActivity.entries()) {
    const recentActivities = activities.filter(
      (a) => now - a.timestamp < ACTIVITY_WINDOW
    );
    if (recentActivities.length >= BLOCK_THRESHOLD) {
      stats.suspiciousUsers.blocked++;
    } else if (recentActivities.length >= SUSPICIOUS_THRESHOLD) {
      stats.suspiciousUsers.suspicious++;
    }
  }

  return stats;
}

// ============================================================
// CLEANUP FUNCTIONS
// ============================================================

/**
 * Periodic cleanup of in-memory caches
 */
export function startPeriodicCleanup() {
  // Cleanup every 10 minutes
  setInterval(() => {
    cleanupRecentEvents();

    // Cleanup old suspicious activity
    const now = Date.now();
    for (const [key, activities] of suspiciousActivity.entries()) {
      const recentActivities = activities.filter(
        (a) => now - a.timestamp < ACTIVITY_WINDOW
      );
      if (recentActivities.length === 0) {
        suspiciousActivity.delete(key);
      } else {
        suspiciousActivity.set(key, recentActivities);
      }
    }

    console.log("🧹 Security cleanup completed:", getSecurityStats());
  }, 10 * 60 * 1000); // Every 10 minutes

  console.log("✅ Periodic security cleanup started");
}

export default {
  strictRateLimiter,
  proctoringRateLimiter,
  standardRateLimiter,
  speedLimiter,
  batchProctoringEvent,
  startBatchFlushing,
  isDuplicateEvent,
  checkUserStatus,
  blockSuspiciousUsers,
  validateRequestSize,
  validateCodeSubmission,
  getSecurityStats,
  startPeriodicCleanup,
};
