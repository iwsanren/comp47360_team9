import convertToGeoJSON from "../../../utils/convertToGeoJSON";

export async function POST() {
  try {
    const areaName = "Manhattan"
    // 2. Overpass API query
    const overpassQuery = `
      [out:json][timeout:25];
      area["name"="${areaName}"]["boundary"="administrative"]->.a;
      (
        node["amenity"="charging_station"](area.a);
        way["amenity"="charging_station"](area.a);
        relation["amenity"="charging_station"](area.a);
      );
      out center tags;
    `;

    // 3. transfer Query to URL safe format
    const encodedQuery = encodeURIComponent(overpassQuery);

    // 4. Overpass API URL
    const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;

    // 5. call Overpass API
    const response = await fetch(url);
    const data = await response.json();

    // 6. convert Overpass output to GeoJSON FeatureCollection
    const geojson = convertToGeoJSON(data.elements)

    // 7. return GeoJSON
    return Response.json(geojson);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch EV charging stations data." },
      { status: 500 }
    );
  }
}
