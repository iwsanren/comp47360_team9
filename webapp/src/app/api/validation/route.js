import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import { withAuthAndTracking } from '../../../middleware/requestTracker';

async function handler(req, payload) {
  // Generate new token with extended expiration
  const newToken = jwt.sign(
    { source: 'Manhattan_My_Way' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production',
    sameSite: 'strict',
    maxAge: 3600,
    path: '/',
  });

  console.log(
    `Token validation and refresh successful for source: ${payload.source}`
  );
  return res;
}

export const POST = withAuthAndTracking(handler, 'API_VALIDATION');
