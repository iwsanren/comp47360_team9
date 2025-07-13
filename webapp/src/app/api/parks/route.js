import { NextResponse } from "next/server";

import convertToGeoJSON from "../../../utils/convertToGeoJSON";

export async function POST() {
  try {

    // Overpass QL query: parks in the specified area
    const overpassQuery = `
        [out:json];
        area[name="Manhattan"][boundary=administrative]->.a;
        (
        way["leisure"="park"](area.a);
        relation["leisure"="park"](area.a);
        );
        out geom;
    `;

    const encodedQuery = encodeURIComponent(overpassQuery);
    const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;


    const response = await fetch(url);
    const data = await response.json();

    // console.log(data)

    // Convert Overpass elements to GeoJSON FeatureCollection
   const geojson = convertToGeoJSON(data.elements)

    return NextResponse.json(geojson);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch park data." },
      { status: 500 }
    );
  }
}
