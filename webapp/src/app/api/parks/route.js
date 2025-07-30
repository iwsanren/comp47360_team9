import { NextResponse } from "next/server";
import osmtogeojson from 'osmtogeojson';
import { withRequestTracking, sendErrorResponse } from '@/middleware/requestTracker';
import { logWithContext, generateRequestId } from '@/utils/requestTracker';

async function parksHandler(req, requestId) {
  logWithContext(requestId, 'info', 'Fetching parks data from Overpass API');
  
  // Overpass QL query: parks in the specified area
  const overpassQuery = `
    [out:json][timeout:25];
    area[name="Manhattan"][boundary=administrative]->.a;
    (
    way["leisure"="park"](area.a);
    relation["leisure"="park"](area.a);
    );
    out body;
    >;
    out skel qt;
  `;

  const encodedQuery = encodeURIComponent(overpassQuery);
  const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Overpass API responded with status: ${response.status}`);
  }
  
  const data = await response.json();

  // Convert Overpass elements to GeoJSON FeatureCollection
  const geojson = osmtogeojson(data);
  
  logWithContext(requestId, 'info', 'Parks data fetched successfully', {
    featuresCount: geojson.features?.length || 0
  });

  const result = NextResponse.json(geojson);
  result.headers.set('X-Request-ID', requestId);
  return result;
}

export const POST = withRequestTracking(async (req, res) => {
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  try {
    return await parksHandler(req, requestId);
  } catch (error) {
    return sendErrorResponse(requestId, 'Failed to fetch park data', 500, {
      error: error.message
    });
  }
});
