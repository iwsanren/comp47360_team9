/**
 * @jest-environment node
 */

import { POST } from '@/app/api/bikes/route';

global.fetch = jest.fn();

// ✅ mock Request class
class MockRequest {
  headers: Headers;

  constructor(headers?: Record<string, string>) {
    this.headers = new Headers(headers);
  }
  
}

describe('/api/bikes route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch station info and status, and return merged GeoJSON', async () => {
    const mockInfo = {
      data: {
        stations: [
          {
            station_id: '123',
            name: 'Test Station',
            lat: 40.0,
            lon: -73.0,
            capacity: 10,
          },
        ],
      },
    };

    const mockStatus = {
      data: {
        stations: [
          {
            station_id: '123',
            num_bikes_available: 5,
            num_docks_available: 5,
            is_renting: 1,
          },
        ],
      },
    };

    // @ts-expect-error: mock fetch is not typed as expected
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockInfo) })
    );
    // @ts-expect-error: mock fetch is not typed as expected
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockStatus) })
    );

    const mockReq = new MockRequest({ 'x-request-id': 'test-id' });
    const response = await POST(mockReq);
    const result = await response.json();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features.length).toBe(1);
    expect(result.features[0].geometry.coordinates).toEqual([-73.0, 40.0]);
    expect(result.features[0].properties).toMatchObject({
      name: 'Test Station',
      capacity: 10,
      bikes_available: 5,
      docks_available: 5,
      is_renting: 1,
      station_id: '123',
    });
  });

  it('should handle missing station status gracefully', async () => {
    const mockInfo = {
      data: {
        stations: [
          {
            station_id: '999',
            name: 'Missing Status Station',
            lat: 40.1,
            lon: -73.1,
            capacity: 8,
          },
        ],
      },
    };

    const mockStatus = {
      data: {
        stations: [], // empty status list
      },
    };

    // @ts-expect-error: mock fetch is not typed as expected
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockInfo) })
    );
    // @ts-expect-error: mock fetch is not typed as expected
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ json: () => Promise.resolve(mockStatus) })
    );

    const mockReq = new MockRequest({ 'x-request-id': 'test-id' });
    const response = await POST(mockReq);
    const result = await response.json();

    expect(result.features[0].properties.bikes_available).toBe(null);
    expect(result.features[0].properties.docks_available).toBe(null);
    expect(result.features[0].properties.is_renting).toBeUndefined();
  });
});
