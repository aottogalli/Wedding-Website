// src/app/api/rsvp/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyRequestToken, stripClaims, signToken } from '@/lib/auth';
import { getSheets, getRows } from '@/lib/sheets';
import {
    normName,
    normPostal,
    toSheetRsvpTitle,
    cleanDietary,
    buildDietMap,
    applyDietaryToList,
    buildGuestPayload,
} from '@/lib/helpers';

const EVENT_MAP = {
    wedding: { field: 'invitationRowIndexes', col: 'U' },
    rehearsal: { field: 'invitedToRehearsalDinner', col: 'X' },
};

function getSpec(url) {
    const event = (new URL(url).searchParams.get('event') || 'wedding').toLowerCase();
    const spec = EVENT_MAP[event];
    return spec ? { key: event, ...spec } : null;
}

function isRehearsal(spec) {
    return spec?.key === 'rehearsal';
}

function setAuthCookie(res, token) {
    res.cookies.set('auth', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 2,
    });
}

/* ======================= GET: always FRESH from SHEET ======================= */
export async function GET(req) {
    const spec = getSpec(req.url);
    if (!spec) return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });

    const auth = await verifyRequestToken();
    if (!auth.ok) return NextResponse.json([], { status: 401 });

    try {
        const sheets = await getSheets();
        const rows = await getRows(sheets);

        // Find the user’s current row in the sheet (robust match)
        const wantFullNorm = auth.guest.fullName; // token stores normalized
        const wantPostal = auth.guest.postalCode;

        let idx = rows.findIndex(
            (r) => normName(r?.[1] || '') === wantFullNorm && normPostal(r?.[11] || '') === wantPostal
        );

        if (idx === -1) {
            // fallback: invitation group + display name
            const disp = normName([auth.guest.firstName, auth.guest.lastName].filter(Boolean).join(' '));
            idx = rows.findIndex(
                (r) => (r?.[0] || '').trim() === auth.guest.invitationName && normName(r?.[1] || '') === disp
            );
        }

        if (
            idx === -1 &&
            Number.isFinite(auth.guest.rowIndex) &&
            auth.guest.rowIndex >= 0 &&
            auth.guest.rowIndex < rows.length
        ) {
            idx = auth.guest.rowIndex;
        }

        // If we still can't resolve, fall back to token view
        if (idx === -1) {
            const source = Array.isArray(auth.guest?.[spec.field]) ? auth.guest[spec.field] : [];

            // Enforce rehearsal invite even on token fallback
            if (isRehearsal(spec) && source.length === 0) {
                return NextResponse.json({ error: 'Not invited to rehearsal dinner' }, { status: 403 });
            }

            const byIndex = new Map((auth.guest?.individualDetails || []).map((d) => [Number(d.rowIndex), d]));
            const rsvpList = source.map((g) => ({
                fullName: g.fullName,
                rsvp: g.rsvp || '',
                dietary: byIndex.get(Number(g.rowIndex))?.dietary || '',
                rowIndex: Number(g.rowIndex),
            }));

            return NextResponse.json(rsvpList, { status: 200 });
        }

        // Rebuild guest fresh from sheet + refresh cookie
        const freshGuest = buildGuestPayload(rows, idx, wantPostal);
        const token = await signToken(freshGuest);

        const invitedList = Array.isArray(freshGuest?.[spec.field]) ? freshGuest[spec.field] : [];

        // Enforce rehearsal invite on fresh sheet view (still refresh auth cookie)
        if (isRehearsal(spec) && invitedList.length === 0) {
            const res = NextResponse.json({ error: 'Not invited to rehearsal dinner' }, { status: 403 });
            setAuthCookie(res, token);
            return res;
        }

        const byIndexNew = new Map((freshGuest.individualDetails || []).map((d) => [Number(d.rowIndex), d]));
        const rsvpList = invitedList.map((g) => ({
            fullName: g.fullName,
            rsvp: g.rsvp || '',
            dietary: byIndexNew.get(Number(g.rowIndex))?.dietary || '',
            rowIndex: Number(g.rowIndex),
        }));

        const res = NextResponse.json(rsvpList, { status: 200 });
        setAuthCookie(res, token);
        return res;
    } catch (e) {
        console.error('RSVP GET fresh error:', e);
        return NextResponse.json([], { status: 500 });
    }
}

/* =============================== PUT: update =============================== */
export async function PUT(req) {
    const spec = getSpec(req.url);
    if (!spec) return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });

    const auth = await verifyRequestToken();
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.code || 401 });
    }

    const body = await req.json().catch(() => ({}));
    const inputList = Array.isArray(body?.rsvpList) ? body.rsvpList : [];
    const currentList = Array.isArray(auth.guest?.[spec.field]) ? auth.guest[spec.field] : [];

    // Enforce rehearsal invite on PUT too (prevents "type URL and submit")
    if (isRehearsal(spec) && currentList.length === 0) {
        return NextResponse.json({ error: 'Not invited to rehearsal dinner' }, { status: 403 });
    }

    // Build Google Sheets updates (match by rowIndex OR normalized name)
    const updates = [];
    const updatedList = currentList.map((g) => {
        const match = inputList.find(
        (r) =>
            Number(r?.rowIndex) === Number(g?.rowIndex) ||
            normName(r?.fullName || '') === normName(g?.fullName || '')
        );
        if (!match) return g;

        const row = Number(g.rowIndex) + 2; // +2 header offset
        const sheetRSVP = toSheetRsvpTitle(match.rsvp);

        updates.push({ range: `Guest List!${spec.col}${row}`, values: [[sheetRSVP]] });

        if (typeof match.dietary !== 'undefined') {
            const diet = cleanDietary(match.dietary);
            updates.push({ range: `Guest List!AC${row}`, values: [[diet]] });
        }

        return { ...g, rsvp: sheetRSVP };
    });

    if (updates.length) {
        const sheets = await getSheets();
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: { valueInputOption: 'USER_ENTERED', data: updates },
        });
    }

    // Refresh token.individualDetails dietary in-memory (no sheet read)
    const dietMap = buildDietMap(inputList, auth.guest.individualDetails || []);
    const updatedIndividuals = applyDietaryToList(auth.guest.individualDetails || [], dietMap);

    // Build updated payload + re-sign cookie
    const guestNoClaims = stripClaims(auth.guest);
    const updatedGuest = {
        ...guestNoClaims,
        [spec.field]: updatedList,
        individualDetails: updatedIndividuals,
    };

    const token = await signToken(updatedGuest);

    // Build a fresh list from the updated token so UI can update immediately
    const byIndexNew = new Map((updatedGuest.individualDetails || []).map((d) => [Number(d.rowIndex), d]));
    const rsvpListNew = (Array.isArray(updatedGuest?.[spec.field]) ? updatedGuest[spec.field] : []).map((g) => ({
        fullName: g.fullName,
        rsvp: g.rsvp || '',
        dietary: byIndexNew.get(Number(g.rowIndex))?.dietary || '',
        rowIndex: Number(g.rowIndex),
    }));

    const res = NextResponse.json(
        { success: true, guest: updatedGuest, token, rsvpList: rsvpListNew },
        { status: 200 }
    );
    setAuthCookie(res, token);
    return res;
}
