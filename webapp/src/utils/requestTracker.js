/**
 * Request Tracking Utilities
 * Used to generate and manage request IDs for complete request chain tracking
 */

/**
 * Generate unique request ID
 * Format: req_{timestamp}_{random}
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `req_${timestamp}_${random}`;
}

/**
 * Structured logger
 * @param {string} requestId - Request ID
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} context - Context information
 */
export function logWithContext(requestId, level, message, context = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId,
    level,
    message,
    context,
    service: 'web-api'
  };

  switch (level) {
    case 'error':
      console.error(`[${requestId}] ${message}`, logData);
      break;
    case 'warn':
      console.warn(`[${requestId}] ${message}`, logData);
      break;
    default:
      console.log(`[${requestId}] ${message}`, logData);
  }
}

/**
 * Extract user information for request tracking
 * @param {Object} req - Request object
 * @returns {Object} User context information
 */
export function extractUserContext(req) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    referer: req.headers.referer,
    method: req.method,
    url: req.url
  };
}
