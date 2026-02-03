'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { getWeddingRsvp, updateWeddingRsvp } from '@/api/weddingAPI';

/** Deadline: lock just after 11:59:59pm local */
function isPastDeadline(now = new Date()) {
  const DEADLINE_LOCAL = new Date('2026-04-02T00:00:00'); // your date
  return now >= DEADLINE_LOCAL;
}

/** Treat any "Guest" name as placeholder (matches "Guest", "guest", "Guest 1", etc.) */
function isPlaceholderGuestName(fullName = '') {
  return /\bguest\b/i.test(String(fullName));
}

function normalize(data) {
  return (Array.isArray(data) ? data : []).map((r) => ({
    fullName: String(r?.fullName ?? ''),

    // read from sheet (keep if you want for placeholders)
    firstName: String(r?.firstName ?? ''),
    lastName: String(r?.lastName ?? ''),

    // editable inputs (START EMPTY)
    firstNameEdit: '',
    lastNameEdit: '',

    rsvp:
      String(r?.rsvp ?? '').trim().toLowerCase() === 'yes'
        ? 'yes'
        : String(r?.rsvp ?? '').trim().toLowerCase() === 'no'
        ? 'no'
        : '',
    dietary: String(r?.dietary ?? '').trim(),
    rowIndex: Number.isFinite(r?.rowIndex) ? Number(r.rowIndex) : undefined,
  }));
}

export default function WeddingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  const [locked, setLocked] = useState(false);
  useEffect(() => setLocked(isPastDeadline()), []);

  const yearRef = useRef(new Date().getFullYear());

  async function refresh() {
    const data = await getWeddingRsvp();
    setRows(normalize(data));
  }

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
    })();

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

  const keyFor = (r, idx) => (Number.isFinite(r.rowIndex) ? r.rowIndex : `row-${idx}`);
  const idFor = (r, idx) => (Number.isFinite(r.rowIndex) ? r.rowIndex : idx);
  const idEq = (r, id, idx) => (Number.isFinite(r.rowIndex) ? r.rowIndex === id : idx === id);

  const setRsvp = (id, idx, value) =>
    setRows((prev) => prev.map((r, i) => (idEq(r, id, i) ? { ...r, rsvp: value } : r)));

  const setDietary = (id, idx, value) =>
    setRows((prev) => prev.map((r, i) => (idEq(r, id, i) ? { ...r, dietary: value } : r)));

  const setFirstName = (id, idx, value) =>
    setRows((prev) => prev.map((r, i) => (idEq(r, id, i) ? { ...r, firstNameEdit: value } : r)));

  const setLastName = (id, idx, value) =>
    setRows((prev) => prev.map((r, i) => (idEq(r, id, i) ? { ...r, lastNameEdit: value } : r)));

  // ✅ Only require names when placeholder guest RSVP is YES
  const placeholderGuestsMissingNames = useMemo(() => {
    return rows.some((r) => {
      if (!isPlaceholderGuestName(r.fullName)) return false;
      if (r.rsvp !== 'yes') return false;

      const fn = String(r.firstNameEdit || '').trim();
      const ln = String(r.lastNameEdit || '').trim();
      return fn.length === 0 || ln.length === 0;
    });
  }, [rows]);

  const canSubmit = useMemo(() => {
    if (locked || saving) return false;
    if (!rows.length) return false;

    const allAnswered = rows.every((r) => r.rsvp === 'yes' || r.rsvp === 'no');
    if (!allAnswered) return false;

    if (placeholderGuestsMissingNames) return false;

    return true;
  }, [rows, locked, saving, placeholderGuestsMissingNames]);

  // ✅ Only send name updates when placeholder guest RSVP is YES
  async function updatePlaceholderGuestNamesIfNeeded() {
    const individuals = rows
      .filter((r) => isPlaceholderGuestName(r.fullName) && r.rsvp === 'yes')
      .map((r) => ({
        rowIndex: r.rowIndex,
        firstName: String(r.firstNameEdit || '').trim(),
        lastName: String(r.lastNameEdit || '').trim(),
      }))
      .filter((p) => Number.isFinite(p.rowIndex) && p.firstName && p.lastName);

    if (!individuals.length) return;

    const resp = await fetch('/api/updateGuestDetails', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ individuals }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Name update failed: ${resp.status} ${txt || resp.statusText}`);
    }
  }

  async function onSubmit() {
    if (locked) {
      setBanner({ type: 'error', msg: 'The RSVP window is now closed. Changes are disabled.' });
      return;
    }

    if (placeholderGuestsMissingNames) {
      setBanner({
        type: 'error',
        msg: 'Please enter a first and last name for any guest listed as “Guest” who is attending before submitting.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      await updatePlaceholderGuestNamesIfNeeded();

      const payload = rows.map((r) => ({
        rowIndex: r.rowIndex,
        fullName: r.fullName,
        rsvp: r.rsvp,
        dietary: String(r.dietary || '').trim(),
      }));

      await updateWeddingRsvp(payload);
      await refresh();

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
      {banner && (
        <div
          className="sticky top-[var(--nav-h)] z-40 w-full border-b px-4 py-3 text-center bg-green/90 border-green text-white"
          role="status"
          aria-live="polite"
        >
          {banner.msg}
        </div>
      )}

      <section className="flex-1 max-w-6xl mx-auto px-5 sm:px-6 md:px-8 py-10 md:py-12">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-altitude mb-5">Wedding RSVP</h1>
          <div className="monogram-swan h-37 mx-auto w-auto mb-3 text-green" aria-hidden="true" />
          <p className="text-lg md:text-md mt-6 mb-5">
            Please RSVP by <span className="font-semibold">April 1st</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
          {/* Left: portrait */}
          <div className="relative w-full md:w-[380px] lg:w-[420px] shrink-0 h-[520px] sm:h-[560px] lg:h-[640px] overflow-hidden">
            <Image
              src="/images/wedding-photo.jpg"
              alt="Wedding portrait"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 380px, 420px"
              className="object-cover"
              priority={false}
            />
          </div>

          {/* Right: RSVP cards */}
          <div className="flex-1 min-w-0 flex flex-col gap-6 md:gap-7 w-full">
            {loading && <div className="text-center text-sm opacity-70">Loading your invitation…</div>}

            {!loading && rows.length === 0 && (
              <div className="text-center text-sm opacity-70">No wedding invitation was found for your login.</div>
            )}

            {!loading &&
              rows.map((g, idx) => {
                const yes = g.rsvp === 'yes';
                const no = g.rsvp === 'no';
                const id = idFor(g, idx);
                const isPlaceholder = isPlaceholderGuestName(g.fullName);

                return (
                  <article key={keyFor(g, idx)} className="rsvp-card px-5 py-5 md:px-6 md:py-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl mb-3 font-altitude">{g.fullName}</h3>

                    {/* ✅ Only show name boxes if placeholder AND RSVP is YES */}
                    {isPlaceholder && g.rsvp === 'yes' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div>
                          <label className="block text-xs md:text-sm mb-1">First Name</label>
                          <input
                            type="text"
                            value={g.firstNameEdit}
                            onChange={(e) => setFirstName(id, idx, e.target.value)}
                            disabled={locked || saving}
                            className="w-full bg-transparent border-b border-green/25 py-1 text-sm md:text-base focus:outline-none disabled:opacity-60 rounded-none"
                            placeholder='Enter first name'
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm mb-1">Last Name</label>
                          <input
                            type="text"
                            value={g.lastNameEdit}
                            onChange={(e) => setLastName(id, idx, e.target.value)}
                            disabled={locked || saving}
                            className="w-full bg-transparent border-b border-green/25 py-1 text-sm md:text-base focus:outline-none disabled:opacity-60 rounded-none"
                            placeholder='Enter last name'
                          />
                        </div>
                      </div>
                    )}

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
                  className={[
                    'w-full md:w-auto',
                    'px-6 py-2 text-sm tracking-wide border transition hover:font-bold rounded-none',
                    !canSubmit
                      ? 'opacity-60 cursor-not-allowed border-green/50 text-green/70 bg-transparent'
                      : saving
                      ? 'cursor-wait border-green text-green bg-transparent'
                      : 'cursor-pointer bg-green text-white border-green hover:opacity-95',
                  ].join(' ')}
                >
                  {saving ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="rsvp-footer">
        <div className="py-10 text-center">
          <div className="monogram mx-auto mb-3 opacity-90" aria-hidden="true" />
          <div className="text-xs opacity-95">© {yearRef.current} by Ashley Ottogalli</div>
        </div>
      </footer>
    </main>
  );
}
