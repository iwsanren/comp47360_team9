/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

import { sendErrorResponse } from '@/middleware/requestTracker';
import { POST } from '@/app/api/contact/route';

jest.mock('@/middleware/requestTracker', () => ({
  withRequestTracking: (handler: any) => handler,
  sendErrorResponse: jest.fn(),
}));
jest.mock('@/utils/requestTracker', () => ({
  logWithContext: jest.fn(),
  generateRequestId: jest.fn(() => 'mock-request-id'),
}));

const mockResponseData = { success: true, message: 'Message sent' };

describe('POST /api/contact', () => {
  const mockFormData = new FormData();
  mockFormData.append('name', 'Alice');
  mockFormData.append('email', 'alice@example.com');
  mockFormData.append('message', 'Hello!');

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponseData),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return JSON response with X-Request-ID header on success', async () => {
    const req = {
      method: 'POST',
      formData: async () => mockFormData,
      headers: new Headers({
        'x-request-id': 'test-id-123',
      }),
    } as unknown as NextRequest;

    const res = await POST(req);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('google.com'), {
      method: 'POST',
      body: mockFormData,
      duplex: 'half',
    });

    const json = await res.json();

    expect(json).toEqual(mockResponseData);
    expect(res.headers.get('X-Request-ID')).toBe('test-id-123');
  });

  it('should handle error and return sendErrorResponse', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 500 })
    );

    const req = {
      method: 'POST',
      formData: async () => mockFormData,
      headers: new Headers(),
    } as unknown as NextRequest;

    await POST(req);

    expect(sendErrorResponse).toHaveBeenCalledWith(
      'mock-request-id',
      'Failed to store message',
      500,
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});
