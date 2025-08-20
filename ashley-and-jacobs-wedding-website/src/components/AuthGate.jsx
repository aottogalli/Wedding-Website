'use client';
import {useAuth} from '@/context/AuthContext';

export default function AuthGate({children}) {
    const {loading} = useAuth();

    if (loading) {
        return (
        <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center" }}>
            <h2>Loading Ashley and Jacob's Wedding Website...</h2>
        </div>)
    }

    return children;
}

