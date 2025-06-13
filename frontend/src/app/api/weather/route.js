export async function POST() {
  const API_KEY = process.env.OPENWEATHER_API_KEY; // use .env to get api key.

  // lat and lon of Manhattan
  const lat = 40.728333;
  const lon = -73.994167;

  try {
    const currentData = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
    );

    const hourlyData = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
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

    return Response.json(weatherData, { status: 200 });

  } catch (error) {
    console.error('Weather API error:', error);
    return Response.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
