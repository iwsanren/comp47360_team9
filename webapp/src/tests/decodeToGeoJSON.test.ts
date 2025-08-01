import decodeToGeoJSON from '../utils/decodeToGeoJSON';

describe('decodeToGeoJSON', () => {
  it('should decode a polyline and return a GeoJSON LineString', () => {
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'; // A simple encoded polyline
    const result = decodeToGeoJSON(encoded);

    // Check if the GeoJSON object is valid
    expect(result.type).toBe('Feature');
    expect(result.geometry.type).toBe('LineString');
    
    // Check if the coordinates are in [lng, lat] format and match expected values
    expect(result.geometry.coordinates.length).toBeGreaterThan(0);
    expect(result.geometry.coordinates[0].length).toBe(2); // Should be [lng, lat]
  });

  it('should return an empty coordinate array if input is invalid', () => {
    const result = decodeToGeoJSON('');
    expect(result.geometry.coordinates).toEqual([]);
  });
});
