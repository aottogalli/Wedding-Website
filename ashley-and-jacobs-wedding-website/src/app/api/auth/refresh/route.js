// src/app/api/auth/refresh/route.js
import { NextResponse } from 'next/server';
import { verifyRequestToken, signToken, stripClaims } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    // read current cookie → payload
    const cur = await verifyRequestToken();
    if (!cur.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // accept partial updates (e.g., dietary, rsvp answers) in body
    const partial = await req.json().catch(() => ({}));

    const nextPayload = { ...stripClaims(cur.guest), ...partial };
    const token = await signToken(nextPayload);

    const res = NextResponse.json({ guest: nextPayload, token });
    res.cookies.set('auth', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 2,
    });
    return res;
}
