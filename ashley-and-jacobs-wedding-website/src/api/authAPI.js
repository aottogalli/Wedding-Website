// Login hits Next API: /api/auth/login
export async function loginGuest({ fullName, postalCode }) {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ fullName, postalCode }),
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* leave as null or string */ }

    if (!res.ok) {
        const msg = typeof data === 'string' ? data : data?.error || 'Login failed';
        throw new Error(msg);
    }

    // Server already set the HttpOnly cookie. Return guest for immediate UI state.
    return { guest: data?.guest ?? null };
}

export async function getMe() {
    const r = await fetch('/api/me', { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return r.json(); // { guest }
}

// Clear cookie via your auth/logout route (you have /api/auth/logout/route.js)
export async function logoutGuest() {
    const r = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    if (!r.ok) throw new Error(await r.text().catch(() => 'Logout failed'));
    return { ok: true };
}
