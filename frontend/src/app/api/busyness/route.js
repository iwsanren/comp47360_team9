import { readFileSync } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'data', 'taxi_zones.geojson');
const geojsonData = JSON.parse(readFileSync(filePath, 'utf-8'));

export async function POST() {
  try {

    return Response.json(geojsonData);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch busyness data." },
      { status: 500 }
    );
  }
}
