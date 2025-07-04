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

    // Convert Overpass elements to GeoJSON FeatureCollection
   const geojson = convertToGeoJSON(data.elements)

    return Response.json(geojson);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch park data." },
      { status: 500 }
    );
  }
}
