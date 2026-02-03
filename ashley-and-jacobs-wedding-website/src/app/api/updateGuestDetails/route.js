// src/app/api/updateGuestDetails/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyRequestToken, stripClaims, signToken } from '@/lib/auth';
import { getSheets } from '@/lib/sheets';
import { normName } from '@/lib/helpers';

export async function POST(req) {
  const auth = await verifyRequestToken();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.code || 401 }
    );
  }

  const {
    address, city, province, country, postalCode, email,
    individuals = [], // [{ rowIndex (recommended), firstName?, lastName?, phone?, fullName? }]
  } = await req.json().catch(() => ({}));

  try {
    const sheets = await getSheets();
    const sheetUpdates = [];

    // ---------------- Household updates (unchanged) ----------------
    const hasHousehold =
      typeof address !== 'undefined' ||
      typeof city !== 'undefined' ||
      typeof province !== 'undefined' ||
      typeof country !== 'undefined' ||
      typeof postalCode !== 'undefined' ||
      typeof email !== 'undefined';

    if (hasHousehold) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Address Updates!A1',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[
            auth.guest.invitationName,
            address || '', city || '', province || '', country || '',
            postalCode || '', email || '', '',
            new Date().toLocaleString(),
          ]],
        },
      });

      for (const g of (auth.guest.invitationRowIndexes || [])) {
        const row = Number(g.rowIndex) + 2;
        sheetUpdates.push({
          range: `Guest List!H${row}:N${row}`,
          values: [[
            address || '', city || '', province || '', country || '',
            postalCode || '', email || '', ''
          ]],
        });
      }
    }

    // ---------------- Safe rowIndex resolution ----------------
    // Prefer rowIndex ALWAYS. If missing, only fallback to fullName when unambiguous.
    const nameToIndexes = new Map();
    for (const d of (auth.guest.individualDetails || [])) {
      const key = normName(d.fullName || '');
      if (!key) continue;
      const arr = nameToIndexes.get(key) || [];
      arr.push(Number(d.rowIndex));
      nameToIndexes.set(key, arr);
    }

    const perPersonEdits = []; // { rowIndex, firstName?, lastName?, phone? }

    for (const person of (individuals || [])) {
      let rIdx = Number(person?.rowIndex);

      if (!Number.isFinite(rIdx) && person?.fullName) {
        const hits = nameToIndexes.get(normName(person.fullName)) || [];
        if (hits.length === 1) rIdx = hits[0];
        if (hits.length > 1) {
          return NextResponse.json(
            { error: `Ambiguous match for "${person.fullName}". Send rowIndex for each person.` },
            { status: 400 }
          );
        }
      }

      if (!Number.isFinite(rIdx)) continue;
      const row = rIdx + 2;

      const hasFirst = typeof person.firstName !== 'undefined';
      const hasLast  = typeof person.lastName  !== 'undefined';
      const hasPhone = typeof person.phone !== 'undefined';

      // ✅ Column 3 (C) = firstName, Column 4 (D) = lastName
      if (hasFirst) {
        sheetUpdates.push({
          range: `Guest List!C${row}`,
          values: [[String(person.firstName).trim()]],
        });
      }
      if (hasLast) {
        sheetUpdates.push({
          range: `Guest List!D${row}`,
          values: [[String(person.lastName).trim()]],
        });
      }

      if (hasPhone) {
        sheetUpdates.push({
          range: `Guest List!N${row}`,
          values: [[String(person.phone).trim()]],
        });
      }

      if (hasFirst || hasLast || hasPhone) {
        perPersonEdits.push({
          rowIndex: rIdx,
          ...(hasFirst ? { firstName: String(person.firstName).trim() } : {}),
          ...(hasLast ? { lastName: String(person.lastName).trim() } : {}),
          ...(hasPhone ? { phone: String(person.phone).trim() } : {}),
        });
      }
    }

    if (sheetUpdates.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.SPREADSHEET_ID,
        resource: { valueInputOption: 'USER_ENTERED', data: sheetUpdates },
      });
    }

    // ---------------- Update token (but DO NOT change fullName) ----------------
    const guestNoClaims = stripClaims(auth.guest);

    const updatedIndividuals = (guestNoClaims.individualDetails || []).map((item) => {
      const edit = perPersonEdits.find((e) => Number(e.rowIndex) === Number(item.rowIndex));
      if (!edit) return item;
      return {
        ...item,
        ...(typeof edit.firstName !== 'undefined' ? { firstName: edit.firstName } : {}),
        ...(typeof edit.lastName !== 'undefined' ? { lastName: edit.lastName } : {}),
        ...(typeof edit.phone !== 'undefined' ? { phone: edit.phone } : {}),
      };
    });

    let updatedGuest = {
      ...guestNoClaims,
      individualDetails: updatedIndividuals,
    };

    // If the logged-in person updated first/last, keep top-level fields aligned (still no fullName change)
    const selfEdit = perPersonEdits.find((e) => Number(e.rowIndex) === Number(guestNoClaims.rowIndex));
    if (selfEdit) {
      updatedGuest = {
        ...updatedGuest,
        ...(typeof selfEdit.firstName !== 'undefined' ? { firstName: selfEdit.firstName } : {}),
        ...(typeof selfEdit.lastName !== 'undefined' ? { lastName: selfEdit.lastName } : {}),
      };
    }

    const token = await signToken(updatedGuest);
    const res = NextResponse.json({ success: true, token, guest: updatedGuest }, { status: 200 });

    res.cookies.set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    return res;
  } catch (err) {
    console.error('Update details error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
