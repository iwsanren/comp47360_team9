// app/api/bike/route.js
import { NextResponse } from "next/server";

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
      );
      out body;
      >;
      out skel qt;
    `;

    const encodedQuery = encodeURIComponent(overpassQuery);
    const url = `https://lz4.overpass-api.de/api/interpreter?data=${encodedQuery}`;

    // Fetch data from Overpass API
    const response = await fetch(url);
    const data = await response.json();

    // console.log(data)

    const geojson = convertToGeoJSON(data.elements)
    // Return raw Overpass JSON response

    return NextResponse.json(geojson);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch bike station data." },
      { status: 500 }
    );
  } 
}

export async function POST() {
    return getData()
}
