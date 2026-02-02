import { redirect } from 'next/navigation';
import { verifyRequestToken } from '@/lib/auth';

export default async function RehearsalDinnerRSVPPage() {
    const auth = await verifyRequestToken();

    // If not authenticated, send to login (extra safe; protected layout should already handle this)
    if (!auth.ok) redirect('/login');

    const invited = Array.isArray(auth.guest?.invitedToRehearsalDinner) ? auth.guest.invitedToRehearsalDinner : [];

    // Invite-only enforcement at the PAGE level
    if (invited.length === 0) redirect('/');

    return (
        <section className="rsvp-gold-background min-h-dvh pt-[var(--nav-h)] flex items-center justify-center">
            <h1 className="font-trajan text-3xl md:text-4xl text-rose">
                Rehearsal Dinner RSVP
            </h1>
        </section>
    );
}