/**
 * API Client with Request Tracking
 * Provides unified API calling interface for frontend with request tracking functionality
 */

import { generateRequestId } from './requestTracker';

/**
 * Enhanced fetch wrapper with request tracking support
 * @param {string} url - API endpoint URL
 * @param {Object} options - fetch options
 * @returns {Promise<{data: any, requestId: string, response: Response}>}
 */
export async function apiCall(url, options = {}) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Build request headers, add Request ID
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...options.headers
  };

  // Log request start
  console.log(`[${requestId}] API Request Started: ${options.method || 'GET'} ${url}`, {
    requestId,
    url,
    method: options.method || 'GET',
    timestamp: new Date().toISOString()
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const duration = Date.now() - startTime;

    // Get Request ID from response (if backend returned it)
    const responseRequestId = response.headers.get('X-Request-ID') || requestId;

    if (!response.ok) {
      // Handle HTTP errors
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'Unknown error' };
      }

      console.error(`[${requestId}] API Error:`, {
        requestId: responseRequestId,
        url,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        error: errorData,
        timestamp: new Date().toISOString()
      });

      throw new APIError(errorData.error || 'API request failed', {
        status: response.status,
        requestId: responseRequestId,
        url,
        data: errorData
      });
    }

    // Parse response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Log request success
    console.log(`[${requestId}] API Request Completed:`, {
      requestId: responseRequestId,
      url,
      status: response.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return {
      data,
      requestId: responseRequestId,
      response
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors or other exceptions
    console.error(`[${requestId}] API Network Error:`, {
      requestId,
      url,
      duration: `${duration}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw new APIError('Network error or request failed', {
      requestId,
      url,
      originalError: error
    });
  }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'APIError';
    this.details = details;
    this.requestId = details.requestId;
    this.status = details.status;
  }
}

/**
 * Convenient wrappers for common API methods
 */
export const api = {
  get: (url, options = {}) => apiCall(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => apiCall(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (url, data, options = {}) => apiCall(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (url, options = {}) => apiCall(url, { ...options, method: 'DELETE' })
};

/**
 * API error handling helper function
 * @param {Error} error - Caught error
 * @param {string} context - Context where error occurred
 */
export function handleAPIError(error, context = 'API operation') {
  if (error instanceof APIError) {
    console.error(`${context} failed:`, {
      message: error.message,
      requestId: error.requestId,
      status: error.status,
      details: error.details
    });
    
    // Can add user-friendly error notification logic here
    return {
      message: error.message,
      requestId: error.requestId,
      userMessage: getUserFriendlyMessage(error)
    };
  }

  console.error(`${context} failed with unexpected error:`, error);
  return {
    message: 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.'
  };
}

/**
 * Convert technical errors to user-friendly messages
 * @param {APIError} error - API error
 * @returns {string} User-friendly error message
 */
function getUserFriendlyMessage(error) {
  const { status, details } = error;

  switch (status) {
    case 401:
      return 'Please log in to continue';
    case 403:
      return 'You don\'t have permission to perform this action';
    case 404:
      return 'The requested resource was not found';
    case 429:
      return 'Too many requests. Please wait a moment and try again';
    case 500:
      return 'Server error. Please try again later';
    default:
      if (details?.url?.includes('/api/directions')) {
        return 'Unable to get directions. Please check your route and try again';
      }
      if (details?.url?.includes('/api/weather')) {
        return 'Unable to get weather information. Please try again';
      }
      return 'Something went wrong. Please try again';
  }
}
