'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { getWeddingRsvp, updateWeddingRsvp } from '@/api/weddingAPI';

/** Deadline: Sept 20, 2025 local time (lock just after 11:59:59pm local) */
function isPastDeadline(now = new Date()) {
  const DEADLINE_LOCAL = new Date('2026-04-02T00:00:00'); // your date
  return now >= DEADLINE_LOCAL;
}

function normalize(data) {
    return (Array.isArray(data) ? data : []).map((r) => {
        const raw = String(r?.rsvp ?? '').trim().toLowerCase();
        return {
            fullName: String(r?.fullName ?? ''),
            rsvp: raw === 'yes' ? 'yes' : raw === 'no' ? 'no' : '',
            dietary: String(r?.dietary ?? '').trim(),
            rowIndex: Number.isFinite(r?.rowIndex) ? Number(r.rowIndex) : undefined,
        };
    });
}

export default function WeddingPage() {
    const [rows, setRows] = useState([]);     // [{ fullName, rsvp: 'yes'|'no'|'', dietary: '' }]
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [banner, setBanner] = useState(null); // {type:'success'|'error'|'info', msg:string}

    // lock after mount (avoids SSR/CSR edge cases near boundary)
    const [locked, setLocked] = useState(false);
    useEffect(() => setLocked(isPastDeadline()), []);

    // Stable year for footer
    const yearRef = useRef(new Date().getFullYear());

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setBanner(null);
            try {
                const data = await getWeddingRsvp();
                if (!alive) return;
                setRows(normalize(data));
            } catch (e) {
                if (!alive) return;
                setRows([]);
                setBanner({ type: 'error', msg: e?.message || 'Failed to load RSVP.' });
            } finally {
                if (alive) setLoading(false);
            }
        }) ();

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!locked) return;
        setBanner({
            type: 'info',
            msg: 'This page is now locked (RSVP deadline has passed). Your last saved responses are shown below.',
        });
    }, [locked]);

    const canSubmit = useMemo(() => {
        if (locked || saving) return false;
        if (!rows.length) return false;
        return rows.every((r) => r.rsvp === 'yes' || r.rsvp === 'no');
    }, [rows, locked, saving]);

    const keyFor = (r, idx) => (Number.isFinite(r.rowIndex) ? r.rowIndex : `row-${idx}`);
    const idEq = (r, id, idx) => (Number.isFinite(r.rowIndex) ? r.rowIndex === id : idx === id);

    const setRsvp = (id, idx, value) =>
        setRows((prev) => prev.map((r, i) => (idEq(r, id, i) ? { ...r, rsvp: value } : r)));
    
    const setDietary = (id, idx, value) =>
        setRows((prev) => prev.map((r, i) => (idEq(r, id, i) ? { ...r, dietary: value } : r)));

    async function onSubmit() {
        if (locked) {
            setBanner({ type: 'error', msg: 'The RSVP window is now closed. Changes are disabled.' });
            return;
        }

        setSaving(true);
        setBanner(null);
        try {
            const payload = rows.map((r) => ({
                fullName: r.fullName,
                rsvp: r.rsvp,
                dietary: (r.dietary || '').trim(),
            }));

            await updateWeddingRsvp(payload);

            const fresh = await getWeddingRsvp();
            setRows(normalize(fresh));

            setBanner({ type: 'success', msg: 'Thanks! Your RSVP has been updated.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            setBanner({ type: 'error', msg: e?.message || 'Could not save your RSVP.' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="rsvp-gold-background min-h-dvh flex flex-col pt-[var(--nav-h)]">
        {/* Banner under navbar */}
            {banner && (
                <div
                    className={`sticky top-[var(--nav-h)] z-40 w-full border-b px-4 py-3 text-center bg-green/90 border-green text-white`}
                    role="status"
                    aria-live="polite"
                >
                    {banner.msg}
                </div>
            )}

            <section className="flex-1 max-w-6xl mx-auto px-5 sm:px-6 md:px-8 py-10 md:py-12">
                {/* Page header */}
                <div className='text-center mb-8 md:mb-10'>
                    <h1 className='mt-4 text-4xl sm:text-5xl md:text-6xl font-altitude mb-5'>Wedding RSVP</h1>
                    <div className="monogram-swan h-37 mx-auto w-auto mb-3 text-green" aria-hidden="true" />
                    {/* <p className='mt-6 text-xl md:text-2xl'>May 9, 2026</p> */}
                    <p className="text-lg md:text-md mt-6 mb-5">Please RSVP by <span className="font-semibold">April 1st</span></p>
                    
                    
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] gap-8 md:gap-10 items-start">
                    {/* Left: portrait */}
                    <div className="relative w-full h-[520px] sm:h-[560px] lg:h-[640px] overflow-hidden">
                        <Image
                        src="/images/wedding-photo.jpg"
                        alt="Wedding portrait"
                        fill
                        sizes="(max-width: 768px) 100vw, 380px"
                        className="object-cover"
                        priority={false}
                        />
                    </div>

                    {/* Right: RSVP cards */}
                    <div className="flex flex-col gap-6 md:gap-7">
                        {loading && <div className="text-center text-sm opacity-70">Loading your invitation…</div>}

                        {!loading && rows.length === 0 && (
                            <div className="text-center text-sm opacity-70">
                                No wedding invitation was found for your login.
                            </div>
                        )}

                        {!loading && rows.map((g, idx) => {
                            const yes = g.rsvp === 'yes';
                            const no = g.rsvp === 'no';

                            const id = Number.isFinite(g.rowIndex) ? g.rowIndex : idx;

                            return (
                                <article key={keyFor(g, idx)} className="rsvp-card px-5 py-5 md:px-6 md:py-6">
                                    <h3 className="text-xl sm:text-2xl md:text-3xl mb-3 font-altitude">{g.fullName}</h3>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => !locked && setRsvp(id, idx, 'yes')}
                                            aria-pressed={yes}
                                            disabled={locked || saving}
                                            className={`px-4 py-2 text-xs md:text-sm tracking-wide border transition hover:font-bold cursor-pointer rounded-none ${
                                                    yes ? 'bg-green text-white border-green' : 'bg-transparent border-green/30'
                                                } ${locked ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-95'}`}
                                        >
                                            Happily Attending
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => !locked && setRsvp(id, idx, 'no')}
                                            aria-pressed={no}
                                            disabled={locked || saving}
                                            className={`px-4 py-2 text-xs md:text-sm tracking-wide border transition hover:font-bold cursor-pointer rounded-none ${
                                                no ? 'bg-green text-white border-green' : 'bg-transparent border-green/30'
                                            } ${locked ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-95'}`}
                                        >
                                            Regretfully Declining
                                        </button>
                                    </div>

                                    <div className="mt-5">
                                        <label className="block text-xs md:text-sm mb-1">Dietary Concerns (leave blank if none)</label>
                                        <input
                                            type="text"
                                            value={g.dietary}
                                            onChange={(e) => setDietary(id, idx, e.target.value)}
                                            disabled={locked || saving}
                                            className="w-full bg-transparent border-b border-green/25 py-1 text-sm md:text-base focus:outline-none disabled:opacity-60"
                                            placeholder="Allergies or restrictions (optional)"
                                        />
                                    </div>
                                </article>
                            );
                        })}

                        {!loading && rows.length > 0 && (
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={onSubmit}
                                    disabled={!canSubmit || saving}
                                    className={['w-full md:w-auto', 'px-6 py-2 text-sm tracking-wide border transition hover:font-bold rounded-none',
                                        !canSubmit ? 'opacity-60 cursor-not-allowed border-green/50 text-green/70 bg-transparent'
                                        : saving ? 'cursor-wait border-green text-green bg-transparent'
                                        : 'cursor-pointer bg-green text-white border-green hover:opacity-95',].join(' ')}
                                >
                                    {saving ? 'Submitting…' : 'Submit'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className='rsvp-footer'>
                <div className="py-10 text-center">
                    <div className="monogram mx-auto mb-3 opacity-90" aria-hidden="true" />
                    <div className="text-xs opacity-95">© {yearRef.current} by Ashley Ottogalli</div>
                </div>
            </footer>
        </main>
    );
}