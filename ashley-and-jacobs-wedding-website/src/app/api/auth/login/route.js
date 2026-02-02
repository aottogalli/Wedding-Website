// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { getSheets, getRows } from '@/lib/sheets';
import { normName, normPostal, buildGuestPayload } from '@/lib/helpers';

export const dynamic = 'force-dynamic'; // avoid caching in dev

// Helper: get column indexes (fallback to your Node.js indices)
function resolveCols(rows) {
    // Try header-based first (case-insensitive)
    const header = (rows?.[0] || []).map(h => String(h || '').trim().toLowerCase());
    let NAME_COL = header.indexOf('full name');
    let POSTAL_COL = header.indexOf('postal code');

    // Fallback to your working Node values if header not found
    if (NAME_COL === -1) NAME_COL = 1;     // you used r[1] before
    if (POSTAL_COL === -1) POSTAL_COL = 11; // you used r[11] before

    return { NAME_COL, POSTAL_COL, hasHeader: header.length > 0 };
}

export async function POST(req) {
    try {
        const { fullName, postalCode } = await req.json();
        if (!fullName || !postalCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Load sheet rows
        const sheets = await getSheets();
        const rows = await getRows(sheets);
        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No data found' }, { status: 500 });
        }

        const { NAME_COL, POSTAL_COL } = resolveCols(rows);

        // Normalize inputs the same way as before
        const nFull = normName(fullName);
        const nPostal = normPostal(postalCode);

        // If the first row is a header row, search all rows (header-safe)
        const startIdx = 1; // skip header if present; harmless if not
        const matchIdx =
        rows.findIndex((r, i) =>
            i >= startIdx &&
            normName(r?.[NAME_COL] || '') === nFull &&
            normPostal(r?.[POSTAL_COL] || '') === nPostal
        );

        if (matchIdx === -1) {
            // Helpful debug (safe) in dev
            const dbg = process.env.NODE_ENV !== 'production'
                ? { searchedName: nFull, searchedPostal: nPostal, nameCol: NAME_COL, postalCol: POSTAL_COL, rows: rows.length }
                : undefined;
            return NextResponse.json({ error: 'Invalid credentials', debug: dbg }, { status: 401 });
        }

        // Build your full guest payload exactly like Node (pass pcN)
        const guestRaw = await buildGuestPayload(rows, matchIdx, nPostal);

        // Make sure array fields are truly arrays so the UI conditions work
        const coerceArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);
        const guest = {
            ...guestRaw,
            invitedToRehearsalDinner: coerceArray(guestRaw.invitedToRehearsalDinner),
        };

        // Sign + set cookie
        const token = await signToken(guest);
        const res = NextResponse.json({ guest, token });
        res.cookies.set('auth', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 2, // 2h
        });
        return res;
    } catch (e) {
        console.error('Auth login error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
