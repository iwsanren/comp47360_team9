import { readFileSync } from "fs";
import path from "path";

const API_KEY = process.env.OPENWEATHER_API_KEY; // use .env to get api key.

const filePath = path.join(
  process.cwd(),
  "public",
  "data",
  "manhattan_zones.json"
);

const data = JSON.parse(readFileSync(filePath, "utf-8"));

export async function POST() {
  
  try {
    const promises = data.map(({ centroid_lat, centroid_lon }) =>
      fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${centroid_lat}&lon=${centroid_lon}&appid=${API_KEY}`
      ).then((res) => res.json())
    );

    const results = await Promise.all(promises);

    const geojsonData = results.reduce((res, d) => {
      res.features.push({ type: "Feature", properties: { value: d.list[0].main.aqi, ...d.list[0] }, geometry: { type: "Point", coordinates: [d.coord.lon, d.coord.lat] } })
      return res
    } ,{ type: "FeatureCollection", features: [] })

    return Response.json(geojsonData);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch air quality data." },
      { status: 500 }
    );
  }
}
