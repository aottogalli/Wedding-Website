'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
    const router = useRouter();
    const timerRef = useRef(null);

    const scheduleRedirectAtExp = (exp) => {
        clearTimeout(timerRef.current);
        if (!exp) return;
        const ms = exp * 1000 - Date.now() - 1500; // small cushion
        if (ms > 0) timerRef.current = setTimeout(() => router.replace('/login'), ms);
        else router.replace('/login');
    };

    const check = async () => {
        try {
            const r = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
            if (!r.ok) throw new Error();
            const { guest } = await r.json();
            scheduleRedirectAtExp(guest?.exp);
        } catch {
            router.replace('/login');
        }
    };

    useEffect(() => {
        check();
        const onFocus = () => check();
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
            clearTimeout(timerRef.current);
        };
    }, []);

    return children;
}
