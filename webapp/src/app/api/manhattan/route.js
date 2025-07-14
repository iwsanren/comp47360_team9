import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

import { ML_API_URL } from "@/constants/url";

const API_KEY = process.env.OPENWEATHER_API_KEY; // use .env to get api key.
const JWT_SECRET = process.env.JWT_SECRET

export async function POST(req) {

  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
      const decoded = verify(token, JWT_SECRET);
      
      if (decoded.source !== 'Manhattan_My_Way') return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

      const { searchParams } = new URL(req.url);
      const data = searchParams.get("data");
      const timestamp = searchParams.get("timestamp");
      
      try {
        const res = await fetch(timestamp ? `${ML_API_URL}?timestamp=${timestamp}` : ML_API_URL, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const geojson = await res.json();

        if (data == 'air-quality') {
          const promises = geojson.features.map(({ properties }) =>
            fetch(
              `http://api.openweathermap.org/data/2.5/air_pollution?lat=${properties.centroid_lat}&lon=${properties.centroid_lon}&appid=${API_KEY}`,
            ).then((res) => res.json())
          );
          const results = await Promise.all(promises);

          const geojsonData = results.reduce((res, d) => {
            res.features.push({ type: "Feature", properties: { aqi: d.list[0].main.aqi, ...d.list[0] }, geometry: { type: "Point", coordinates: [d.coord.lon, d.coord.lat] } })
            return res
          } ,{ type: "FeatureCollection", features: [] })

          return NextResponse.json(geojsonData);
        } else {
          if (timestamp) {
            return NextResponse.json(geojson);
          } else {
            await Promise.all(
              geojson.features.map(async (feature) => {
                const res = await fetch(
                  `http://api.openweathermap.org/data/2.5/air_pollution?lat=${feature.properties.centroid_lat}&lon=${feature.properties.centroid_lon}&appid=${API_KEY}`
                );
                const data = await res.json();

                // 更新 properties
                feature.properties.aqi = data.list[0].main.aqi;
                feature.properties.air_pollution = data;
              })
            );
            return NextResponse.json(geojson);
          }
        }
      } catch (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Failed to fetch air quality data." },
          { status: 500 }
        );
      }
  } catch {
    // Invalid or expired token
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

}
