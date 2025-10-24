/**
 * Error Handler Utility for Frontend
 *
 * Provides centralized error handling, user-friendly messages,
 * and retry logic for API calls
 */

/**
 * Error types for classification
 */
export const ErrorType = {
  NETWORK: "NETWORK",
  RATE_LIMIT: "RATE_LIMIT",
  AUTHENTICATION: "AUTHENTICATION",
  VALIDATION: "VALIDATION",
  SERVER: "SERVER",
  BLOCKED: "BLOCKED",
  UNKNOWN: "UNKNOWN",
};

/**
 * API Error class for structured error handling
 */
export class APIError extends Error {
  constructor(message, type, statusCode, response = null, retryable = false) {
    super(message);
    this.name = "APIError";
    this.type = type;
    this.statusCode = statusCode;
    this.response = response;
    this.retryable = retryable;
    this.timestamp = Date.now();
  }
}

/**
 * Parse API error response and classify it
 */
export async function parseAPIError(response) {
  let errorData;

  try {
    errorData = await response.json();
  } catch {
    errorData = { error: "Unknown error occurred" };
  }

  const statusCode = response.status;
  let type = ErrorType.UNKNOWN;
  let retryable = false;
  let userMessage = errorData.error || errorData.message || "An error occurred";

  // Classify error based on status code
  switch (statusCode) {
    case 400:
      type = ErrorType.VALIDATION;
      userMessage =
        errorData.message || "Invalid request. Please check your input.";
      break;

    case 401:
      type = ErrorType.AUTHENTICATION;
      userMessage = "Session expired. Please log in again.";
      break;

    case 403:
      type = ErrorType.BLOCKED;
      userMessage =
        errorData.message ||
        "Access denied. Your account may be temporarily blocked due to suspicious activity.";
      break;

    case 413:
      type = ErrorType.VALIDATION;
      userMessage =
        errorData.message || "Request too large. Please reduce the file size.";
      break;

    case 429:
      type = ErrorType.RATE_LIMIT;
      userMessage =
        errorData.message ||
        `Too many requests. Please wait ${errorData.retryAfter || 60} seconds.`;
      retryable = true;
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      type = ErrorType.SERVER;
      userMessage = "Server error. Please try again later.";
      retryable = true;
      break;

    default:
      type = ErrorType.UNKNOWN;
      userMessage = errorData.message || "An unexpected error occurred.";
  }

  return new APIError(userMessage, type, statusCode, errorData, retryable);
}

/**
 * Enhanced fetch with error handling, retry logic, and timeout
 */
export async function fetchWithErrorHandling(
  url,
  options = {},
  retryOptions = {}
) {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    timeout = 30000, // 30 seconds
    onRetry = null,
  } = retryOptions;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is OK
      if (!response.ok) {
        const apiError = await parseAPIError(response);

        // Don't retry non-retryable errors
        if (!apiError.retryable || attempt === maxRetries) {
          throw apiError;
        }

        lastError = apiError;

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, apiError);
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (attempt + 1))
        );
        continue;
      }

      // Success - return response
      return response;
    } catch (error) {
      // Handle network errors
      if (error.name === "AbortError") {
        lastError = new APIError(
          "Request timeout. Please check your connection.",
          ErrorType.NETWORK,
          0,
          null,
          true
        );
      } else if (error instanceof APIError) {
        lastError = error;
      } else if (!navigator.onLine) {
        lastError = new APIError(
          "No internet connection. Please check your network.",
          ErrorType.NETWORK,
          0,
          null,
          true
        );
      } else {
        lastError = new APIError(
          error.message || "Network error occurred",
          ErrorType.NETWORK,
          0,
          null,
          true
        );
      }

      // Retry on network errors if attempts remain
      if (lastError.retryable && attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, lastError);
        }
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (attempt + 1))
        );
        continue;
      }

      // Max retries reached or non-retryable error
      break;
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Safe API call wrapper for proctoring events
 * Silently fails to not disrupt user experience
 */
export async function safeProctoringCall(apiCall, fallbackAction = null) {
  try {
    return await apiCall();
  } catch (error) {
    // Log error but don't show to user for proctoring events
    console.error("Proctoring event failed (silent):", error.message);

    // Execute fallback action if provided
    if (fallbackAction) {
      fallbackAction(error);
    }

    return null;
  }
}

/**
 * User notification helper
 */
export function showErrorNotification(error, customMessage = null) {
  const message = customMessage || error.message || "An error occurred";

  // You can customize this to use your app's notification system
  // For now, using a simple approach
  return {
    type: "error",
    message: message,
    action: error.retryable ? "Retry" : null,
    duration: error.type === ErrorType.RATE_LIMIT ? 10000 : 5000,
  };
}

/**
 * Error recovery suggestions based on error type
 */
export function getErrorRecoveryAction(error) {
  switch (error.type) {
    case ErrorType.NETWORK:
      return {
        message: "Please check your internet connection and try again.",
        action: "Retry",
        canRetry: true,
      };

    case ErrorType.RATE_LIMIT:
      return {
        message: `Please wait ${Math.ceil(
          error.response?.retryAfter || 60
        )} seconds before trying again.`,
        action: "Wait",
        canRetry: true,
        waitTime: (error.response?.retryAfter || 60) * 1000,
      };

    case ErrorType.AUTHENTICATION:
      return {
        message: "Your session has expired. Please log in again.",
        action: "Login",
        canRetry: false,
      };

    case ErrorType.BLOCKED:
      return {
        message:
          "Your account has been temporarily blocked. Please contact support if you believe this is an error.",
        action: "Contact Support",
        canRetry: false,
      };

    case ErrorType.VALIDATION:
      return {
        message: "Please check your input and try again.",
        action: "Fix Input",
        canRetry: false,
      };

    case ErrorType.SERVER:
      return {
        message: "Server error. Please try again in a few moments.",
        action: "Retry",
        canRetry: true,
      };

    default:
      return {
        message: "An unexpected error occurred. Please try again.",
        action: "Retry",
        canRetry: true,
      };
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff(
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !error.retryable) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s (capped at maxDelay)
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Queue for failed requests (can be retried later)
 */
class FailedRequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(request) {
    this.queue.push({
      ...request,
      timestamp: Date.now(),
      attempts: 0,
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      // Skip old requests (older than 5 minutes)
      if (Date.now() - request.timestamp > 5 * 60 * 1000) {
        this.queue.shift();
        continue;
      }

      try {
        await request.fn();
        this.queue.shift(); // Success, remove from queue
      } catch (error) {
        request.attempts++;

        // Remove if max attempts reached
        if (request.attempts >= 3) {
          console.error("Request failed after 3 attempts:", request);
          this.queue.shift();
        } else {
          // Keep in queue for next try
          break;
        }
      }

      // Wait between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.processing = false;
  }

  size() {
    return this.queue.length;
  }
}

export const failedRequestQueue = new FailedRequestQueue();

// Process queue when online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Connection restored. Processing failed requests...");
    failedRequestQueue.processQueue();
  });
}

export default {
  APIError,
  ErrorType,
  parseAPIError,
  fetchWithErrorHandling,
  safeProctoringCall,
  showErrorNotification,
  getErrorRecoveryAction,
  retryWithBackoff,
  failedRequestQueue,
};
