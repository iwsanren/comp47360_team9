import { NextResponse } from 'next/server';
import osmtogeojson from 'osmtogeojson';

export async function POST() {
  try {
    // 2. Overpass API query
    const overpassQuery = `
      [out:json][timeout:25];
      area["name"="Manhattan"]["boundary"="administrative"]->.a;
      (
        node["amenity"="charging_station"](area.a);
        way["amenity"="charging_station"](area.a);
      );
      out center;
    `;

    // 3. transfer Query to URL safe format
    const encodedQuery = encodeURIComponent(overpassQuery);

    // 4. Overpass API URL
    const url = `https://lz4.overpass-api.de/api/interpreter?data=${encodedQuery}`;

    // 5. call Overpass API
    const response = await fetch(url);
    const data = await response.json();

    // 6. convert Overpass output to GeoJSON FeatureCollection
    const geojson = osmtogeojson(data)

    // 7. return GeoJSON
    return NextResponse.json(geojson);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch EV charging stations data." },
      { status: 500 }
    );
  }
}
