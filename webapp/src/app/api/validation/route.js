import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST() {
  const token = jwt.sign({ source: 'Manhattan_My_Way' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 3600,
    path: '/',
  });

  return res;
}