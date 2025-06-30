export async function POST() {
  const API_KEY = process.env.OPENAQ_API_KEY;

  const url = `https://api.openaq.org/v3/locations?coordinates=40.728333,-73.994167&radius=12000&limit=1000`;

  const res = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}