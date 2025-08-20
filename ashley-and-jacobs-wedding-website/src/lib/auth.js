// src/lib/auth.js
import { SignJWT, jwtVerify } from 'jose';

const SECRET_VALUE = process.env.JWT_SECRET;
if (!SECRET_VALUE) throw new Error('[auth] JWT_SECRET is not set');
const SECRET_BYTES = new TextEncoder().encode(SECRET_VALUE);

export function stripClaims(obj = {}) {
    const { iat, exp, nbf, jti, iss, aud, ...rest } = obj;
    return rest;
}

export async function signToken(payload, expiresIn = '2h') {
    return await new SignJWT(stripClaims(payload))
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET_BYTES);
}

export async function verifyJwt(token) {
    const { payload } = await jwtVerify(token, SECRET_BYTES);
    return payload;
}

// Next 15: cookies() is async — must be awaited
export async function verifyRequestToken() {
    try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const tok = cookieStore.get('auth')?.value || null;
        if (!tok) return { ok: false, code: 401, error: 'Unauthorized' };
        const payload = await verifyJwt(tok);
        return { ok: true, guest: payload };
    } catch (e) {
        return { ok: false, code: 403, error: e?.message || 'Forbidden' };
    }
}
