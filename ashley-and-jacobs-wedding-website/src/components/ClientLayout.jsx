// src/components/ClientLayout.jsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const { refresh } = useAuth();

    // Run the refresh at most once per pathname (avoids Strict Mode double-run)
    const ranForPathRef = useRef('');

    // Only skip on the public login page; middleware protects everything else
    const isPublic = pathname === '/login';

    useEffect(() => {
        if (isPublic) return;

        // Don't run more than once for the same path
        if (ranForPathRef.current === pathname) return;
        ranForPathRef.current = pathname;

        // Refresh context from /api/proxy/me; ignore errors — middleware will redirect if unauth
        Promise.resolve(refresh?.()).catch(() => {});
    }, [isPublic, pathname, refresh]);

    return children;
}
