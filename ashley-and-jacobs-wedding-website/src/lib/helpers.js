export const normName = (s = '') =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();

export const normPostal = (s = '') => s.toUpperCase().replace(/\s/g, '');

export const toSheetRsvpTitle = (v) => {
    const s = (v ?? '').toString().trim().toLowerCase();
    if (['yes', 'y', 'attending', 'true', '1'].includes(s)) return 'Yes';
    if (['no', 'n', 'decline', 'declining', 'false', '0'].includes(s)) return 'No';
    return '';
};

export const cleanDietary = (s) => (/^none$/i.test((s ?? '').toString().trim()) ? '' : (s ?? '').toString().trim());

export const buildDietMap = (rsvpList = [], individuals = []) => {
    const byName = new Map(individuals.map((d) => [normName(d.fullName || ''), Number(d.rowIndex)]));
    const m = new Map();
    for (const r of rsvpList) {
        let key = Number(r?.rowIndex);
        if (!Number.isFinite(key)) key = byName.get(normName(r?.fullName || ''));
        if (Number.isFinite(key) && typeof r?.dietary !== 'undefined') m.set(key, cleanDietary(r.dietary));
    }
    return m;
};

export const applyDietaryToList = (list = [], dietMap = new Map()) =>
    list.map((item) => (dietMap.has(Number(item.rowIndex)) ? { ...item, dietary: dietMap.get(Number(item.rowIndex)) } : item));

export function buildGuestPayload(rows, rowIndex, postalCode) {
    const invitationGroup = (rows[rowIndex]?.[0] || '').trim();
    const matches = rows.map((row, i) => ({ row, index: i })).filter((o) => (o.row[0] || '').trim() === invitationGroup);

    const isTruthy = (v) => {
        if (v === true) return true;
        const s = String(v ?? '').trim().toLowerCase();
        return ['true', 'yes', 'y', '1', 'x', 'checked'].includes(s);
    };

    const mapGuests = (colRSVP, filterCol = null) =>
        matches
        .filter((o) => filterCol == null || isTruthy(o.row?.[filterCol]))
        .map((o) => ({
            fullName: (o.row?.[1] || '').trim(),
            rsvp: (o.row?.[colRSVP] || '').trim(),
            rowIndex: Number(o.index),
        }));

    const invitationRowIndexes   = mapGuests(20);        // wedding (V)
    const invitedToRehearsalDinner = mapGuests(23, 21);  // rehearsal (Y) if invited? (W)

    const individualDetails = matches.map((o) => ({
        fullName: (o.row[1] || '').trim(),
        rowIndex: Number(o.index),
        dietary: (o.row[28] || '').trim(), // AC
        phone: (o.row[13] || '').trim(),   // N
    }));

    const completeData = [7, 8, 9, 10, 11, 12, 13].every((i) => (rows[rowIndex][i] || '').trim());

    return {
        fullName: normName(rows[rowIndex][1] || ''),
        firstName: rows[rowIndex][2],
        lastName: rows[rowIndex][3],
        postalCode,
        invitationName: invitationGroup,
        userDataComplete: completeData,
        rowIndex: Number(rowIndex),
        invitationRowIndexes,
        invitedToRehearsalDinner,
        individualDetails,
    };
}
