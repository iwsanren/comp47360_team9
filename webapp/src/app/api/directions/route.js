import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { sendErrorResponse } from '@/middleware/requestTracker';
import { logWithContext, generateRequestId } from '@/utils/requestTracker';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const modes = ['driving', 'walking', 'bicycling', 'transit']; 

export async function POST(req) {
  // Setup request tracking
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  // Log request start
  logWithContext(requestId, 'info', 'API Request Started', {
    endpoint: 'POST /api/directions'
  });

  const startTime = Date.now();

  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return sendErrorResponse(requestId, 'Missing token', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.source !== 'Manhattan_My_Way') {
      return sendErrorResponse(requestId, 'Invalid token', 403);
    }

    const { origin, destination } = await req.json();
    
    // Log request parameters
    logWithContext(requestId, 'info', 'Processing directions request', {
      origin, 
      destination,
      modes: modes.length
    });

    const promises = modes.map(async (mode) => {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.lat},${origin?.lng}&destination=${destination?.lat},${destination?.lng}&mode=${mode}&alternatives=true&key=${API_KEY}`;
      
      logWithContext(requestId, 'info', `Fetching directions for mode: ${mode}`);
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status !== 'OK') {
        logWithContext(requestId, 'warn', `Google Maps API warning for mode ${mode}`, {
          status: data.status,
          error_message: data.error_message
        });
      }
      
      return { mode, data };
    });

    const resultsArray = await Promise.all(promises);
    const results = Object.fromEntries(resultsArray.map(r => [r.mode, r.data]));

    logWithContext(requestId, 'info', 'Directions request completed successfully', {
      routesFound: Object.keys(results).length
    });

    const response = NextResponse.json(results);
    response.headers.set('X-Request-ID', requestId);
    
    // Log request success
    const duration = Date.now() - startTime;
    logWithContext(requestId, 'info', 'API Request Completed', {
      endpoint: 'POST /api/directions',
      duration: `${duration}ms`
    });

    return response;
      
  } catch (error) {
    // Log request error
    const duration = Date.now() - startTime;
    logWithContext(requestId, 'error', 'API Request Failed', {
      endpoint: 'POST /api/directions',
      duration: `${duration}ms`,
      error: error.message
    });

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendErrorResponse(requestId, 'Invalid or expired token', 403, {
        tokenError: true
      });
    }

    return sendErrorResponse(requestId, 'Failed to fetch routing data', 500, {
      error: error.message
    });
  }
}
