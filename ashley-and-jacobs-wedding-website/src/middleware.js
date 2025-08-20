// src/middleware.js — CLEAN
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_VALUE = process.env.JWT_SECRET;
if (!SECRET_VALUE) throw new Error('JWT_SECRET not set in middleware');
const SECRET = new TextEncoder().encode(SECRET_VALUE);

export async function middleware(req) {
    const { pathname } = req.nextUrl;

    // Let API + static + login through
    if (
        pathname.startsWith('/api') ||
        pathname === '/login' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/assets') ||
        pathname.startsWith('/fonts') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Gate everything else by the HttpOnly auth cookie
    const token = req.cookies.get('auth')?.value;
    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    try {
        await jwtVerify(token, SECRET);
        return NextResponse.next();
    } catch {
        const r = NextResponse.redirect(new URL('/login', req.url));
        r.cookies.set('auth', '', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 0,
        });
        return r;
    }
}

// Only run on non-API, non-static paths
export const config = {
    matcher: ['/((?!api|_next|_vercel|images|assets|fonts|favicon.ico).*)'],
};
