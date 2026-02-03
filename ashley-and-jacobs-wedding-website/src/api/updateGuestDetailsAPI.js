async function parseJsonSafe(res, fallback) {
    const text = await res.text(); // read once
    if (!res.ok) {
        throw new Error(text || `Request failed (${res.status})`);
    }
    if (!text) return fallback;
    try {
        return JSON.parse(text);
    } catch {
        return fallback;
    }
}

export async function updateGuestIndividuals(individuals = []) {
    const payload = (Array.isArray(individuals) ? individuals : []).map((p) => ({
        rowIndex: Number(p?.rowIndex),
        firstName: typeof p?.firstName !== 'undefined' ? String(p.firstName).trim() : undefined,
        lastName: typeof p?.lastName !== 'undefined' ? String(p.lastName).trim() : undefined,
        phone: typeof p?.phone !== 'undefined' ? String(p.phone).trim() : undefined,
    }));
  
    const res = await fetch('/api/updateGuestDetails', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ individuals: payload }),
    });
  
    return parseJsonSafe(res, { success: false });
}