import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET

const modes = ['driving', 'walking', 'bicycling', 'transit']; 

export async function POST(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    const decoded = verify(token, JWT_SECRET);
    
    if (decoded.source !== 'Manhattan_My_Way') return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

    const { origin, destination } = await req.json();

    try {
      const promises = modes.map(async (mode) => {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.lat},${origin?.lng}&destination=${destination?.lat},${destination?.lng}&mode=${mode}&alternatives=true&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        return { mode, data };
      });

      const resultsArray = await Promise.all(promises);
      const results = Object.fromEntries(resultsArray.map(r => [r.mode, r.data]));

      return NextResponse.json(results);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch routing data." },
        { status: 500 }
      );
    }
    // Token is valid, decoded content shown above
  } catch {
    // Invalid or expired token
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

}
