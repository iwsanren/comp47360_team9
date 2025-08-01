import { co2Emissions, getTransitTypeCO2Emissions, finalGreenScore, meterToMiles, transitEmissions } from '../utils/formula';

describe('Emission Calculations', () => {
  test('meterToMiles correctly converts meters to miles', () => {
    expect(meterToMiles(1609.34)).toBeCloseTo(1, 3); // 1 mile = 1609.34 meters
  });

  test('co2Emissions returns correct value for 1 mile', () => {
    expect(co2Emissions(1609.34)).toBeCloseTo(0.3, 1); // 1 mile * 0.27
  });

  test('getTransitTypeCO2Emissions for BUS', () => {
    expect(getTransitTypeCO2Emissions('BUS', 1609.34)).toBeCloseTo(0.2, 1); // ~0.177
  });

  test('getTransitTypeCO2Emissions for SUBWAY', () => {
    expect(getTransitTypeCO2Emissions('SUBWAY', 1609.34)).toBeCloseTo(0.0, 1); // ~0.049
  });

  test('getTransitTypeCO2Emissions for RAIL', () => {
    expect(getTransitTypeCO2Emissions('RAIL', 1609.34)).toBeCloseTo(0.1, 1); // ~0.077
  });

  test('getTransitTypeCO2Emissions for GONDOLA_LIFT', () => {
    expect(getTransitTypeCO2Emissions('GONDOLA_LIFT', 1609.34)).toBeCloseTo(0.0, 1); // ~0.039
  });

  test('getTransitTypeCO2Emissions for OTHER and default returns 0', () => {
    expect(getTransitTypeCO2Emissions('OTHER', 1000)).toBe(0);
    expect(getTransitTypeCO2Emissions('UNKNOWN_TYPE', 1000)).toBe(0);
  });
});

describe('Green Score Calculation', () => {
  test('finalGreenScore returns correct inverse score', () => {
    expect(finalGreenScore(0.2)).toBe(80);
    expect(finalGreenScore(1)).toBe(0);
    expect(finalGreenScore(0)).toBe(100);
  });
});

describe('transitEmissions', () => {
  const mockRoutes = [
    {
      legs: [
        {
          steps: [
            {
              travel_mode: 'TRANSIT',
              transit_details: {
                line: {
                  vehicle: {
                    type: 'BUS',
                  },
                },
              },
              distance: { value: 1000 },
            },
            {
              travel_mode: 'DRIVING',
              distance: { value: 500 },
            },
          ],
        },
      ],
    },
    {
      legs: [
        {
          steps: [
            {
              travel_mode: 'TRANSIT',
              transit_details: {
                line: {
                  vehicle: {
                    type: 'SUBWAY',
                  },
                },
              },
              distance: { value: 3000 },
            },
          ],
        },
      ],
    },
  ];

  test('returns [min, max] emissions', () => {
    const result = transitEmissions(mockRoutes);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toBeLessThanOrEqual(result[1]);
  });
});
