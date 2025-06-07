export async function POST(res) {
  const API_KEY = process.env.OPENWEATHER_API_KEY; // use .env to get api key.

  // lat and lon of Manhattan
  const lat = 40.4342;
  const lon = -73.5939;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=imperial&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await response.json();

    return Response.json(weatherData, { status: 200 });

  } catch (error) {
    console.error('Weather API error:', error);
    return Response.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
