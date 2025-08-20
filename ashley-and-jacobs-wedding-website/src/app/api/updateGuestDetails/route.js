// src/app/api/updateGuestDetails/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyRequestToken, stripClaims, signToken } from '@/lib/auth';
import { getSheets } from '@/lib/sheets';
import { normName } from '@/lib/helpers'; // ⬅️ only this one is needed

export async function POST(req) {
  const auth = await verifyRequestToken();
  if (!auth.ok) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.code || 401 });

  const {
    address, city, province, country, postalCode, email,
    individuals = [], // [{ rowIndex?, fullName?, firstName?, lastName?, phone? }]
  } = await req.json().catch(() => ({}));

  const composeFullName = (prevFull = '', newFirst, newLast) => {
    const parts = prevFull.trim().split(/\s+/);
    const prevFirst = parts[0] || '';
    const prevLast = parts.slice(1).join(' ');
    const first = typeof newFirst !== 'undefined' ? String(newFirst).trim() : prevFirst;
    const last  = typeof newLast  !== 'undefined' ? String(newLast).trim()  : prevLast;
    return `${first} ${last}`.trim();
  };

  try {
    const sheets = await getSheets();
    const sheetUpdates = [];

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

    const nameToIndex = new Map(
      (auth.guest.individualDetails || []).map(d => [normName(d.fullName || ''), Number(d.rowIndex)])
    );

    const perPersonEdits = []; // { rowIndex, newFullName?, newPhone? }

    for (const person of (individuals || [])) {
      let rIdx = Number(person?.rowIndex);
      if (!Number.isFinite(rIdx) && person?.fullName) {
        rIdx = nameToIndex.get(normName(person.fullName)) ?? NaN;
      }
      if (!Number.isFinite(rIdx)) continue;

      const row = rIdx + 2;

      const hasFirst = typeof person.firstName !== 'undefined';
      const hasLast  = typeof person.lastName  !== 'undefined';
      if (hasFirst) sheetUpdates.push({ range: `Guest List!C${row}`, values: [[String(person.firstName).trim()]] });
      if (hasLast)  sheetUpdates.push({ range: `Guest List!D${row}`, values: [[String(person.lastName).trim()]] });

      if (hasFirst || hasLast) {
        const existing = (auth.guest.individualDetails || []).find(d => Number(d.rowIndex) === rIdx);
        const newFull = composeFullName(existing?.fullName || '', person.firstName, person.lastName);
        perPersonEdits.push({ rowIndex: rIdx, newFullName: newFull });
      }

      if (typeof person.phone !== 'undefined') {
        const newPhone = String(person.phone).trim();
        sheetUpdates.push({ range: `Guest List!N${row}`, values: [[newPhone]] });
        const existingEdit = perPersonEdits.find(e => e.rowIndex === rIdx);
        if (existingEdit) existingEdit.newPhone = newPhone; else perPersonEdits.push({ rowIndex: rIdx, newPhone });
      }
    }

    if (sheetUpdates.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.SPREADSHEET_ID,
        resource: { valueInputOption: 'USER_ENTERED', data: sheetUpdates },
      });
    }

    const updateNamesEverywhere = (arr = []) =>
      arr.map(item => {
        const edit = perPersonEdits.find(e => Number(e.rowIndex) === Number(item.rowIndex));
        return edit ? { ...item, ...(edit.newFullName ? { fullName: edit.newFullName } : {}) } : item;
      });

    const updateIndividuals = (arr = []) =>
      arr.map(item => {
        const edit = perPersonEdits.find(e => Number(e.rowIndex) === Number(item.rowIndex));
        return edit ? {
          ...item,
          ...(edit.newFullName ? { fullName: edit.newFullName } : {}),
          ...(typeof edit.newPhone !== 'undefined' ? { phone: edit.newPhone } : {}),
        } : item;
      });

    const guestNoClaims = stripClaims(auth.guest);

    let updatedGuest = {
      ...guestNoClaims,
      invitationRowIndexes: updateNamesEverywhere(guestNoClaims.invitationRowIndexes || []),
      invitedToBridalShower: updateNamesEverywhere(guestNoClaims.invitedToBridalShower || []),
      invitedToRehearsalDinner: updateNamesEverywhere(guestNoClaims.invitedToRehearsalDinner || []),
      individualDetails: updateIndividuals(guestNoClaims.individualDetails || []),
    };

    const selfEdit = perPersonEdits.find(e => Number(e.rowIndex) === Number(guestNoClaims.rowIndex));
    if (selfEdit?.newFullName) {
      const parts = selfEdit.newFullName.split(/\s+/);
      updatedGuest = {
        ...updatedGuest,
        fullName: selfEdit.newFullName,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
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
