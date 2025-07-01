// app/api/bike/route.js

import convertToGeoJSON from "../../../utils/convertToGeoJSON";

const getData = async () => {
   try {
    // Parse POST body if area name is passed, default to Manhattan
    const areaName = "Manhattan"

    // Overpass QL query for bike stations and bike lanes
    const overpassQuery = `
      [out:json][timeout:25];
      area[name="${areaName}"][boundary=administrative]->.a;

      (
        node["amenity"="bicycle_rental"](area.a);      // Bike rental stations
        way["highway"="cycleway"](area.a);             // Dedicated cycleways
        way["cycleway"](area.a);                       // Roads with cycleway tags
        relation["highway"="cycleway"](area.a);        // Cycleway relations (if any)
        relation["cycleway"](area.a);                  // Other relations with cycleway tags
      );
      out body;
      >;
      out skel qt;
    `;

    const encodedQuery = encodeURIComponent(overpassQuery);
    const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;

    // Fetch data from Overpass API
    const response = await fetch(url);
    const data = await response.json();

    const geojson = convertToGeoJSON(data.elements)
    // Return raw Overpass JSON response

    return Response.json(geojson);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch bike station and bike lane data." },
      { status: 500 }
    );
  } 
}

export async function GET() {
    return getData()
}

export async function POST() {
    return getData()
}
