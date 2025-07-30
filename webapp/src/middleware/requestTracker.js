/**
 * Request Tracking Middleware
 * Provide unified request tracking for all API routes
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import { generateRequestId, logWithContext, extractUserContext } from '@/utils/requestTracker';

/**
 * Request tracking middleware
 * Add unique ID and structured logging for each API request
 */
export function withRequestTracking(handler) {
  return async function trackedHandler(req, res) {
    // Get or generate request ID
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.requestId = requestId;

    // Extract user context
    const userContext = extractUserContext(req);
    
    // Log request start
    logWithContext(requestId, 'info', `API Request Started`, {
      endpoint: `${req.method} ${req.url}`,
      userContext
    });

    const startTime = Date.now();

    try {
      // Execute original handler function
      const result = await handler(req, res);
      
      // Log request success
      const duration = Date.now() - startTime;
      logWithContext(requestId, 'info', `API Request Completed`, {
        endpoint: `${req.method} ${req.url}`,
        duration: `${duration}ms`,
        status: res.statusCode || 200
      });

      return result;
    } catch (error) {
      // Log request error
      const duration = Date.now() - startTime;
      logWithContext(requestId, 'error', `API Request Failed`, {
        endpoint: `${req.method} ${req.url}`,
        duration: `${duration}ms`,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        userContext
      });

      // If response hasn't been sent, return structured error
      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Internal Server Error',
          requestId,
          timestamp: new Date().toISOString()
        });
      }

      throw error;
    }
  };
}

/**
 * Error response helper function for Next.js API routes
 * @param {string} requestId - Request ID
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} context - Additional context
 */
export function sendErrorResponse(requestId, message, status = 500, context = {}) {
  logWithContext(requestId, 'error', message, context);
  
  const response = NextResponse.json({
    error: message,
    requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { context })
  }, { status });
  
  response.headers.set('X-Request-ID', requestId);
  return response;
}

/**
 * JWT Authentication Middleware
 * Features:
 * - Automatically validates JWT token validity
 * - Checks if token source is 'Manhattan_My_Way'
 * - Unified handling of authentication failure error responses
 * - Attaches decoded user information to req.user
 */
export function withAuth(handler) {
  return async function authHandler(req, res) {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      const requestId = req.headers.get('x-request-id') || generateRequestId();
      return sendErrorResponse(requestId, 'Missing token', 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.source !== 'Manhattan_My_Way') {
        const requestId = req.headers.get('x-request-id') || generateRequestId();
        return sendErrorResponse(requestId, 'Invalid token', 403);
      }
      
      req.user = decoded;
      return await handler(req, res);
    } catch (error) {
      const requestId = req.headers.get('x-request-id') || generateRequestId();
      return sendErrorResponse(requestId, 'Invalid or expired token', 403, {
        tokenError: true
      });
    }
  };
}

/**
 * Combined Middleware: Authentication + Request Tracking
 * Features:
 * - Combines JWT authentication and request tracking functionality
 * - Suitable for API endpoints that require authentication
 * - Provides complete request lifecycle management
 */
export function withAuthAndTracking(handler) {
  return withAuth(withRequestTracking(handler));
}
