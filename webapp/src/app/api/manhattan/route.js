import { NextResponse } from 'next/server';
import { withAuthAndTracking } from "../../../middleware/requestTracker";
import { ML_API_URL } from "@/constants/url";

const API_KEY = process.env.OPENWEATHER_API_KEY; // use .env to get api key.

async function handler(req, payload) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const timestamp = searchParams.get("timestamp");

  const res = await fetch(timestamp ? `${ML_API_URL}?timestamp=${timestamp}` : ML_API_URL, 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.cookies.get('token')?.value}`,
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

    console.log(`Successfully retrieved air quality data for ${geojsonData.features.length} locations`);
    return NextResponse.json(geojsonData);
  } else {
    if (timestamp) {
      await Promise.all(
        geojson.features.map(async (feature) => {
          const res = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${feature.properties.centroid_lat}&lon=${feature.properties.centroid_lon}&appid=${API_KEY}`);
          const data = await res.json();
          const d = data.list.find(info => info.dt == timestamp) // get future aqi data
          feature.properties.aqi = d.main.aqi;
          feature.properties.air_pollution = d;
          feature.properties.dt = d.dt
        })
      );
      console.log(`Successfully retrieved forecast air quality data for ${geojson.features.length} zones`);
      return NextResponse.json(geojson);
    } else {
      await Promise.all(
        geojson.features.map(async (feature) => {
          const res = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${feature.properties.centroid_lat}&lon=${feature.properties.centroid_lon}&appid=${API_KEY}`);
          const data = await res.json();

          // Update properties
          feature.properties.aqi = data.list[0].main.aqi;
          feature.properties.air_pollution = data;
        })
      );
      console.log(`Successfully retrieved current air quality data for ${geojson.features.length} zones`);
      return NextResponse.json(geojson);
    }
  }
}

export const POST = withAuthAndTracking(handler, 'API_MANHATTAN');
