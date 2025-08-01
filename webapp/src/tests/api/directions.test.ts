// tests/api/directions.test.ts
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/directions/route';

jest.mock('jsonwebtoken');
jest.mock('@/middleware/requestTracker', () => ({
  sendErrorResponse: jest.fn((requestId, message, status, details) =>
    new Response(JSON.stringify({ error: message, ...details }), { status })
  ),
}));
jest.mock('@/utils/requestTracker', () => ({
  logWithContext: jest.fn(),
  generateRequestId: jest.fn(() => 'mock-request-id'),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('POST /api/directions', () => {
  const validToken = 'valid.jwt.token';
  const mockDecoded = { source: 'Manhattan_My_Way' };

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
  });

  it('returns directions for all modes', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ status: 'OK', routes: [{ summary: 'Sample Route' }] }),
    });

    const body = {
      origin: { lat: 40.748817, lng: -73.985428 },
      destination: { lat: 40.712776, lng: -74.005974 },
      isPredictionMode: true,
      timestamp: 1722618000,
      };

      const req = new NextRequest('https://example.com/api/directions', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers({
        'Content-Type': 'application/json', 
        cookie: `token=${validToken}`,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('driving');
    expect(data).toHaveProperty('walking');
    expect(data).toHaveProperty('bicycling');
    expect(data).toHaveProperty('transit');
  });

  it('returns 401 if token is missing', async () => {
    const req = new NextRequest('https://example.com/api/directions', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 if token is invalid', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ source: 'Another_Source' });

    const req = new NextRequest('https://example.com/api/directions', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: new Headers({ cookie: `token=${validToken}` }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 500 on fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('API failure'));

    const req = new NextRequest('https://example.com/api/directions', {
      method: 'POST',
      body: JSON.stringify({ origin: {}, destination: {} }),
      headers: new Headers({ cookie: `token=${validToken}` }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
