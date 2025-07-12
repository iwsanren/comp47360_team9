// import { readFileSync } from "fs";
// import path from "path";
import { ML_API_URL } from "@/constants/url";

const API_KEY = process.env.OPENWEATHER_API_KEY; // use .env to get api key.

// const filePath = path.join(
//   process.cwd(),
//   "public",
//   "data",
//   "manhattan_zones.json"
// );

// const data = JSON.parse(readFileSync(filePath, "utf-8"));

export async function POST(req) {

  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  
  try {

    const res = await fetch(ML_API_URL, { method: "POST" });
    const geojson = await res.json();

    if (data == 'air-quality') {
      const promises = geojson.features.map(({ properties }) =>
        fetch(
          `http://api.openweathermap.org/data/2.5/air_pollution?lat=${properties.centroid_lat}&lon=${properties.centroid_lon}&appid=${API_KEY}`
        ).then((res) => res.json())
      );
      const results = await Promise.all(promises);

      const geojsonData = results.reduce((res, d) => {
        res.features.push({ type: "Feature", properties: { aqi: d.list[0].main.aqi, ...d.list[0] }, geometry: { type: "Point", coordinates: [d.coord.lon, d.coord.lat] } })
        return res
      } ,{ type: "FeatureCollection", features: [] })

      return Response.json(geojsonData);
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
      return Response.json(geojson);
    }
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch air quality data." },
      { status: 500 }
    );
  }
}
