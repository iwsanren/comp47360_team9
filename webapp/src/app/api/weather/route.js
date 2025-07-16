import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET

// lat and lon of Manhattan
const lat = 40.728333;
const lon = -73.994167;

let cachedWeather = null;
let lastFetched = 0;

export async function POST(req) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);      

    const now = Date.now();
    
    if (cachedWeather && now - lastFetched < 10 * 60 * 1000) {
      return NextResponse.json(cachedWeather);
    }

    if (decoded.source !== 'Manhattan_My_Way') return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

    try {
      const currentData = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
      );

      const hourlyData = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
      );

      if (hourlyData.status !== 200 || currentData.status !== 200) {
        throw new Error('Failed to fetch weather data');
      }

      const currentWeatherData = await currentData.json();
      const hourlyWeatherData = await hourlyData.json();

      const weatherData = {
        current: currentWeatherData,
        hourly: hourlyWeatherData
      }

      // store in cookie
      cachedWeather = weatherData;
      lastFetched = now;

      return NextResponse.json(cachedWeather, { status: 200 });

    } catch (error) {
      console.error('Weather API error:', error);
      return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
    }
  } catch {
    // Invalid or expired token
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
}
