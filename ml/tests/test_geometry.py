# Importing.
import pytest
from shapely.geometry import mapping
from shapely import wkt

# Helper function to parse geometry strings into GeoJSON-like dicts.
def parse_geometry(geom_str):
    if geom_str.startswith("POLYGON (("):
        points = geom_str.replace("POLYGON ((", "").replace("))", "").split(", ")
        coords = [[float(x), float(y)] for x, y in (p.split(" ") for p in points)]
        return {"type": "Polygon", "coordinates": [coords]}
    elif geom_str.startswith("MULTIPOLYGON (("):
        return mapping(wkt.loads(geom_str))
    return {}

# Test that a basic POLYGON string is parsed correctly.
def test_polygon_parsing():
    geom = "POLYGON ((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7))"
    result = parse_geometry(geom)

    assert result["type"] == "Polygon"
    assert len(result["coordinates"][0]) == 5
    assert result["coordinates"][0][0] == [-74.0, 40.7]

# Test that a MULTIPOLYGON string is parsed correctly.
def test_multipolygon_parsing():
    geom = "MULTIPOLYGON (((-74.0 40.7, -74.0 40.71, -73.99 40.71, -73.99 40.7, -74.0 40.7)))"
    result = parse_geometry(geom)

    assert result["type"] == "MultiPolygon"
    assert isinstance(result["coordinates"], list)
    assert len(result["coordinates"]) == 1

# Test that unsupported geometry strings just return an empty dict.
def test_invalid_geometry_string():
    geom = "LINESTRING (-74.0 40.7, -74.0 40.71)"
    result = parse_geometry(geom)

    assert result == {}