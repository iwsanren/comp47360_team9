import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'data', 'taxi_zones.geojson');
const geojsonData = JSON.parse(readFileSync(filePath, 'utf-8'));
const outputData = { ...geojsonData, features: geojsonData.features.filter(d => d.properties.borough == 'Manhattan')}
// console.log(geojsonData.features.filter(d => d.properties.borough == 'Manhattan'))
export async function POST() {
  try {

    return Response.json(outputData);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch busyness data." },
      { status: 500 }
    );
  }
}
