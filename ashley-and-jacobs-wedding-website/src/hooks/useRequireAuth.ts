'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useRequireAuth() {
    const { guest, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !guest) {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
    }, [guest, loading, pathname, router]);

    return { guest, loading };
}
