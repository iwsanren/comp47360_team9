import { NextResponse } from 'next/server';
import osmtogeojson from 'osmtogeojson';
import { withRequestTracking, sendErrorResponse } from '@/middleware/requestTracker';
import { logWithContext, generateRequestId } from '@/utils/requestTracker';

async function evChargingHandler(req, requestId) {
  logWithContext(requestId, 'info', 'Fetching EV charging stations from Overpass API');
  
  // Overpass API query
  const overpassQuery = `
    [out:json][timeout:25];
    area["name"="Manhattan"]["boundary"="administrative"]->.a;
    (
      node["amenity"="charging_station"](area.a);
      way["amenity"="charging_station"](area.a);
    );
    out center;
  `;

  // Transfer Query to URL safe format
  const encodedQuery = encodeURIComponent(overpassQuery);

  // Overpass API URL
  const url = `https://lz4.overpass-api.de/api/interpreter?data=${encodedQuery}`;

  // Call Overpass API
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Overpass API responded with status: ${response.status}`);
  }
  
  const data = await response.json();

  // Convert Overpass output to GeoJSON FeatureCollection
  const geojson = osmtogeojson(data);
  
  logWithContext(requestId, 'info', 'EV charging stations data fetched successfully', {
    stationsCount: geojson.features?.length || 0
  });

  // Return GeoJSON
  const result = NextResponse.json(geojson);
  result.headers.set('X-Request-ID', requestId);
  return result;
}

export const POST = withRequestTracking(async (req, res) => {
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  try {
    return await evChargingHandler(req, requestId);
  } catch (error) {
    return sendErrorResponse(requestId, 'Failed to fetch EV charging stations data', 500, {
      error: error.message
    });
  }
});
