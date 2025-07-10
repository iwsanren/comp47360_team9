// Carbon emission factors (kg CO2 per km)
const EMISSION_FACTORS = {
  walking: 0,
  bicycling: 0,
  driving: 0.2, // Average car emission
  transit: 0.04, // Public transport emission per passenger
};

export interface EmissionData {
  amount: number;
  color: string;
  description: string;
}

export function calculateCarbonEmission(mode: string, distanceKm: number): EmissionData {
  const factor = EMISSION_FACTORS[mode as keyof typeof EMISSION_FACTORS] || 0;
  const emission = factor * distanceKm;

  switch (mode) {
    case 'walking':
      return {
        amount: 0,
        color: '#0FD892',
        description: 'Free of emissions'
      };
    case 'bicycling':
      return {
        amount: 0,
        color: '#0FD892', 
        description: 'Fast and clean'
      };
    case 'driving':
      return {
        amount: emission,
        color: '#FF281B',
        description: 'Highest emission'
      };
    case 'transit':
      return {
        amount: emission,
        color: '#FFC800',
        description: 'A few emissions'
      };
    default:
      return {
        amount: 0,
        color: '#0FD892',
        description: 'Unknown'
      };
  }
}

export function formatEmission(emission: number): string {
  if (emission === 0) return '0 kg CO₂';
  if (emission < 1) return `${emission.toFixed(1)} kg CO₂`;
  return `${emission.toFixed(1)} kg CO₂`;
}

export function parseDistanceToKm(distanceText: string): number {
  // Parse distance text like "1.5 mi" or "2.3 km"
  const match = distanceText.match(/([\d.]+)\s*(mi|km|m)/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'mi':
      return value * 1.60934; // Convert miles to km
    case 'm':
      return value / 1000; // Convert meters to km
    case 'km':
    default:
      return value;
  }
}
