// app/api/bikes/route.js
import { NextResponse } from "next/server";
import { withRequestTracking } from "../../../middleware/requestTracker";
// import osmtogeojson from 'osmtogeojson';

async function handler() {
  // Parse POST body if area name is passed, default to Manhattan
  // const areaName = "Manhattan"

  // Overpass QL query for bike stations and bike lanes
  // const overpassQuery = `
  //   [out:json][timeout:25];
  //   area[name="${areaName}"][boundary=administrative]->.a;
  //   (
  //     node["amenity"="bicycle_rental"](area.a);      // Bike rental stations
  //   );
  //   out geom;
  // `;

  // const encodedQuery = encodeURIComponent(overpassQuery);
  // const url = `https://lz4.overpass-api.de/api/interpreter?data=${encodedQuery}`;

  // Fetch data from Overpass API
  // const response = await fetch(url);
  // const data = await response.json();

  // console.log(data)

  // const geojson = osmtogeojson(data)
  // Return raw Overpass JSON response

  const info = await fetch('https://gbfs.citibikenyc.com/gbfs/en/station_information.json').then(res => res.json());
  const status = await fetch('https://gbfs.citibikenyc.com/gbfs/en/station_status.json').then(res => res.json());

  const statusMap = new Map();
  status.data.stations.forEach(s => statusMap.set(s.station_id, s));

  const geojson = {
    type: "FeatureCollection",
    features: info.data.stations.map(station => {
      const s = statusMap.get(station.station_id);
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [station.lon, station.lat]
        },
        properties: {
          name: station.name,
          capacity: station.capacity,
          bikes_available: s?.num_bikes_available ?? null,
          docks_available: s?.num_docks_available ?? null,
          is_renting: s?.is_renting,
          station_id: station.station_id,
        }
      };
    })
  };

  console.log(`Successfully retrieved ${geojson.features.length} bike stations`);
  return NextResponse.json(geojson);
}

export const POST = withRequestTracking(handler, 'API_BIKES');
