export async function POST(req) {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  const { origin, destination } = await req.json();

  const modes = ['driving', 'walking', 'bicycling', 'transit']; 

  try {
    const promises = modes.map(async (mode) => {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.lat},${origin?.lng}&destination=${destination?.lat},${destination?.lng}&mode=${mode}&alternatives=true&key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return { mode, data };
    });

    const resultsArray = await Promise.all(promises);
    const results = Object.fromEntries(resultsArray.map(r => [r.mode, r.data]));

    return Response.json(results);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch routing data." },
      { status: 500 }
    );
  }
}
