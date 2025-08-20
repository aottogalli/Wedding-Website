// src/app/api/debug/jwt/route.js
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
    const val = process.env.JWT_SECRET || '';
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
    return NextResponse.json({ jwt_len: val.length, jwt_sha256: hex.slice(0,16) + '…' });
}
