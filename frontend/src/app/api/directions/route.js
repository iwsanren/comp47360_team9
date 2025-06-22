export async function GET(request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const origin = 'Times Square,New York,NY';
  const destination = 'Museum of the City,New York,NY';

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=transit&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return new Response(
        JSON.stringify({ error: data.status, message: data.error_message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Fetch failed' }),
      { status: 500 }
    );
  }
}
