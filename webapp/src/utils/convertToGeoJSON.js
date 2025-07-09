const convertToGeoJSON = (elements) => {
  const features = elements.map(el => {
    let geometry = null;

    if (el.type === "node") {
      geometry = {
        type: "Point",
        coordinates: [el.lon, el.lat]
      };
    }

    else if (el.type === "way") {
      if (el.geometry) {
        // Determine if the way is closed to form a Polygon
        const coords = el.geometry.map(p => [p.lon, p.lat]);

        const isPolygon = coords.length > 3 &&
          coords[0][0] === coords[coords.length - 1][0] &&
          coords[0][1] === coords[coords.length - 1][1];

        geometry = {
          type: isPolygon ? "Polygon" : "LineString",
          coordinates: isPolygon ? [coords] : coords
        };
      }
      else if (el.center) {
        // If geometry is not available but center exists, use center as Point
        geometry = {
          type: "Point",
          coordinates: [el.center.lon, el.center.lat]
        };
      }
    }

    else if (el.type === "relation") {
      // Relations are usually complex; simplify as Point if center exists
      if (el.center) {
        geometry = {
          type: "Point",
          coordinates: [el.center.lon, el.center.lat]
        };
      }
      else if (el.members) {
        // To fully parse relation structures, additional processing is needed to link member node data
        // Extend here based on project requirements
        geometry = null;
      }
    }

    if (!geometry) return null;

    return {
      type: "Feature",
      geometry,
      properties: {
        id: el.id,
        type: el.type,
        tags: el.tags || {}
      }
    };
  }).filter(Boolean);

  return {
    type: "FeatureCollection",
    features
  };
}

export default convertToGeoJSON