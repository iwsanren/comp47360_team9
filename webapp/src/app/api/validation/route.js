import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

export async function POST() {
  try {
    const token = sign({ source: 'Manhattan_My_Way' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('JWT signing error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}