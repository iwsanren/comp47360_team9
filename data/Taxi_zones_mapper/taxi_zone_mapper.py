
from pathlib import Path
import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import Point, LineString
import pandas as pd

shp_path = Path(__file__).parent / "taxi_zones" / "taxi_zones.shp"
zones = gpd.read_file(shp_path)

# Convert to WGS84 coordinate system (latitude and longitude)
zones = zones.to_crs(epsg=4326)

# uncomment the following lines to preview the data
# print(zones.head())

# Quick visualization to check shape integrity
# zones.plot()  
# plt.show()


# === Example busyness dataframe (to be replaced with actual predictions) ===
# Simulate busyness values for demo purposes
busyness_df = pd.DataFrame({
    'LocationID': zones['LocationID'],  # use actual IDs in the shapefile
    'busyness': [round(abs(hash(x)) % 100 / 100, 2) for x in zones['LocationID']]
})

# Merge busyness into zones GeoDataFrame
zones = zones.merge(busyness_df, on='LocationID', how='left')


# === 1. Map a single point to its corresponding zone ===
point = Point(-73.989344, 40.741303) 
matched_zone = zones[zones.contains(point)]
print(matched_zone)

# Example output:
#      OBJECTID  Shape_Leng  ...                                           geometry busyness
# 241       234    0.036072  ...  POLYGON ((-73.98997 40.7349, -73.9899 40.73443...     0.34  

# === 2. Determine which zones a route passes through ===
route_coords = [(-73.985, 40.76), (-73.98, 40.75), (-73.975, 40.745)]
route = LineString(route_coords)

intersected_zones = zones[zones.intersects(route)]
print("\nRoute intersects zones:")
print(intersected_zones[['zone', 'LocationID', 'borough', 'busyness']])

# Example output:
# Route intersects zones:
#                           zone  LocationID    borough  busyness
# 168             Midtown Center         161  Manhattan      0.61
# 171              Midtown South         164  Manhattan      0.64
# 177                Murray Hill         170  Manhattan      0.70
# 237  Times Sq/Theatre District         230  Manhattan      0.30


# === 3. Export enriched GeoJSON for frontend heatmap ===
output_path = Path(__file__).parent / "zones_with_busyness.geojson"
zones.to_file(output_path, driver="GeoJSON")
print(f"\nGeoJSON with busyness exported to {output_path}")


