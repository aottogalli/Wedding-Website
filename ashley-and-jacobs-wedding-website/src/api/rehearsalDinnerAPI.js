// src/api/rehearsalDinnerAPI.js

async function parseJsonSafe(res, fallback) {
    const text = await res.text(); // read once
    if (!res.ok) {
        throw new Error(text || `Request failed (${res.status})`);
    }
    if (!text) return fallback; // empty body
    try {
        return JSON.parse(text);
    } catch {
        return fallback; // invalid JSON
    }
}
  
/** Load the current user's Rehearsal Dinner RSVP rows */
export async function getRehearsalDinnerRsvp() {
    const res = await fetch('/api/rsvp?event=rehearsal', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    return parseJsonSafe(res, []); // always return an array
}
  
/** Update Rehearsal Dinner RSVP */
export async function updateRehearsalDinnerRsvp(payload = []) {
    const rsvpList = payload.map((r) => {
        const v = String(r?.rsvp ?? '').trim().toLowerCase();
        return {
            rowIndex: Number(r?.rowIndex),
            fullName: r?.fullName || '',
            rsvp: v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '',
            dietary: String(r?.dietary ?? '').trim(),
        };
    });

    const res = await fetch('/api/rsvp?event=rehearsal', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rsvpList }),
    });

    return parseJsonSafe(res, { success: false });
}
  