// src/app/api/me/route.js
import { NextResponse } from 'next/server';
import { verifyRequestToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const result = await verifyRequestToken();
    return NextResponse.json({ guest: result.ok ? result.guest : null }, { status: 200 });
}
