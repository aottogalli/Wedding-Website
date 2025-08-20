// src/api/bridalAPI.js

async function parseJsonSafe(res, fallback) {
    const text = await res.text();                 // read once
    if (!res.ok) {
      throw new Error(text || `Request failed (${res.status})`);
    }
    if (!text) return fallback;                    // ← empty body
    try { return JSON.parse(text); } catch {       // ← invalid JSON
      return fallback;
    }
}

/** Load the current user's Bridal Shower RSVP rows */
export async function getBridalRsvp() {
    const res = await fetch('/api/rsvp?event=bridal', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    return parseJsonSafe(res, []);                 // always give the page an array
}

/** Update Bridal Shower RSVP. */
export async function updateBridalRsvp(payload = []) {
    const rsvpList = payload.map((r) => {
      const v = String(r?.rsvp ?? '').trim().toLowerCase();
      return {
        rowIndex: Number(r?.rowIndex),
        fullName: r?.fullName || '',
        rsvp: v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '',
        dietary: String(r?.dietary ?? '').trim(),
      };
    });

    const res = await fetch('/api/rsvp?event=bridal', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ rsvpList }),
    });

    return parseJsonSafe(res, { success: false });
}
