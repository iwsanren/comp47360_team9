import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendErrorResponse } from '@/middleware/requestTracker';
import { logWithContext, generateRequestId } from '@/utils/requestTracker';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET

// lat and lon of Manhattan
const lat = 40.728333;
const lon = -73.994167;

let cachedWeather = null;
let lastFetched = 0;

export async function POST(req) {
  // Setup request tracking
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  // Log request start
  logWithContext(requestId, 'info', 'API Request Started', {
    endpoint: 'POST /api/weather'
  });

  const startTime = Date.now();

  try {
    const result = await weatherHandler(req, requestId);
    
    // Log request success
    const duration = Date.now() - startTime;
    logWithContext(requestId, 'info', 'API Request Completed', {
      endpoint: 'POST /api/weather',
      duration: `${duration}ms`
    });

    return result;
  } catch (error) {
    // Log request error
    const duration = Date.now() - startTime;
    logWithContext(requestId, 'error', 'API Request Failed', {
      endpoint: 'POST /api/weather',
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
}

async function weatherHandler(req, requestId) {
  const { cookies } = await import('next/headers');
  const token = cookies().get('token')?.value;

  if (!token) {
    return sendErrorResponse(requestId, 'Missing token', 401);
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);      

    const now = Date.now();
    
    // Check cache
    if (cachedWeather && now - lastFetched < 10 * 60 * 1000) {
      logWithContext(requestId, 'info', 'Returning cached weather data', {
        cacheAge: `${Math.round((now - lastFetched) / 1000)}s`
      });
      const response = NextResponse.json(cachedWeather);
      response.headers.set('X-Request-ID', requestId);
      return response;
    }

    if (decoded.source !== 'Manhattan_My_Way') {
      return sendErrorResponse(requestId, 'Invalid token', 403);
    }

    logWithContext(requestId, 'info', 'Fetching fresh weather data', {
      location: { lat, lon },
      cacheExpired: !cachedWeather || now - lastFetched >= 10 * 60 * 1000
    });

    try {
      const currentData = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
      );

      const hourlyData = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
      );

      if (hourlyData.status !== 200 || currentData.status !== 200) {
        logWithContext(requestId, 'error', 'Weather API returned non-200 status', {
          currentStatus: currentData.status,
          hourlyStatus: hourlyData.status
        });
        throw new Error('Failed to fetch weather data');
      }

      const currentWeatherData = await currentData.json();
      const hourlyWeatherData = await hourlyData.json();

      const weatherData = {
        current: currentWeatherData,
        hourly: hourlyWeatherData
      }

      // store in cache
      cachedWeather = weatherData;
      lastFetched = now;

      logWithContext(requestId, 'info', 'Weather data fetched and cached successfully', {
        currentTemp: currentWeatherData.main?.temp,
        condition: currentWeatherData.weather?.[0]?.main
      });

      const response = NextResponse.json(cachedWeather, { status: 200 });
      response.headers.set('X-Request-ID', requestId);
      return response;

    } catch (error) {
      return sendErrorResponse(requestId, 'Failed to fetch weather data', 500, {
        error: error.message,
        apiKeyConfigured: !!API_KEY
      });
    }
  } catch (error) {
    return sendErrorResponse(requestId, 'Invalid or expired token', 403, {
      tokenProvided: !!token
    });
  }
}
