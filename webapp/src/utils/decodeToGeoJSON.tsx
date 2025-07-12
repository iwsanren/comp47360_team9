import polyline from '@mapbox/polyline';

const decodeToGeoJSON = (encoded: string) => { 

    // Decode returns an array of [lat, lng]
    const decoded = polyline?.decode(encoded);

    // Mapbox uses [lng, lat], so flip each pair
    const coordinates = decoded.map(([lat, lng]) => [lng, lat]);

    const routeGeoJson = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: coordinates,
        },
        properties: {},
    };
    return routeGeoJson
}

export default decodeToGeoJSON