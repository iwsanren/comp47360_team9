import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { withRequestTracking } from "../../../middleware/requestTracker";

async function handler() {
  const token = jwt.sign({ source: 'Manhattan_My_Way' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 3600,
    path: '/',
  });

  console.log('New JWT token generated for Manhattan_My_Way');
  return res;
}

export const POST = withRequestTracking(handler, 'API_TOKEN');