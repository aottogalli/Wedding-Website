// src/app/(protected)/layout.tsx
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

async function requireAuth() {
    const token = (await cookies()).get('auth')?.value;
    if (!token) redirect('/login');
    try {
        await jwtVerify(token, SECRET);
    } catch {
        // Don't attempt to mutate cookies here; just redirect.
        redirect('/login');
    }
}

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
    await requireAuth();
    return <>{children}</>;
}
