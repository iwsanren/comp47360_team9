import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const newToken = jwt.sign({ source: payload.source }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', newToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
  }

}