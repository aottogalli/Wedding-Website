'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { getBridalRsvp, updateBridalRsvp } from '@/api/bridalAPI';

/** Deadline: Sept 20, 2025 local time (lock just after 11:59:59pm local) */
function isPastDeadline(now = new Date()) {
  const DEADLINE_LOCAL = new Date('2025-09-28T00:00:00'); // your date
  return now >= DEADLINE_LOCAL;
}

export default function BridalShowerPage() {
  const [rows, setRows] = useState([]);     // [{ fullName, rsvp: 'yes'|'no'|'', dietary: '' }]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null); // {type:'success'|'error'|'info', msg:string}

  // lock after mount (avoids SSR/CSR edge cases near boundary)
  const [locked, setLocked] = useState(false);
  useEffect(() => { setLocked(isPastDeadline()); }, []);

  // Stable year for footer
  const yearRef = useRef(new Date().getFullYear());

  // FAQ data + state (NO hooks inside IIFEs)
  const A = ({ href, children }) => (
    <a href={href} className="underline decoration-[#E497A3]/60 underline-offset-4 hover:decoration-[#E497A3]">
      {children}
    </a>
  );

  const faqs = [
    {
      q: 'When and where is the shower?',
      content: () => (
        <p>
          The bridal shower will be held on <strong>Sunday, October 26, 2025</strong> at <strong>11:00 AM</strong> at <strong>The Royal Ambassador</strong>, in <strong>the Greenhouse</strong>.
        </p>
      ),
    },
    {
      q: 'Is there a theme or dress code?',
      content: () => (
        <p>
          Yes, the theme is <strong>Pearls and Prosecco</strong> with a Touch of Pink. Guests are encouraged to wear their pearls.
        </p>
      ),
    },
    { q: 'Can I bring a guest or my children?', a: 'We kindly ask that only the guests listed on your invitation attend.' },
    {
      q: 'Who is hosting the shower?',
      content: () => (
        <p>
          The shower is being lovingly hosted by my mom and future mother-in-law, <strong>Helena Ottogalli</strong> and <strong>Raffaela Marcantonio</strong>.
        </p>
      ),
    },
    { q: 'Will there be food and drinks served?', a: 'Yes, a full lunch will be served, along with prosecco and refreshments to enjoy throughout the event.' },
    { q: 'Are dietary needs accommodated?', a: 'Absolutely, please note any dietary restrictions when you RSVP, and we will do our best to accommodate.' },
    { q: 'Do you have a registry?', a: 'We kindly prefer monetary gifts only.' },
    { q: 'Will there be games or activities?', a: 'Yes! Fun games will be played, and prizes will be awarded to the winners.' },
    {
      q: 'Why did I receive a recipe card?',
      content: () => (
        <p>
          The recipe cards are our <strong>guest book for the event</strong>. Please bring yours filled out with a favourite recipe for us to try in the future. As a special thank-you, a prize will be given to a special winner out of those who remember to bring their card.
        </p>
      ),
    },
    {
      q: 'Is parking available at the venue?',
      content: () => (
        <p>
          Yes, complimentary parking is available at <strong>The Royal Ambassador</strong>. For the shower, please use the <strong>second parking lot</strong>, which is closest to the greenhouse.
        </p>
      ),
    },
    {
      q: 'Will photos be taken/shared?',
      content: () => (
        <p>
          Yes! Our dear friend, <strong>Roxanne Duke-Karns</strong>, will be capturing the event. You can view her work at <a href="https://roxannedukephotog.com" className="underline" target="_blank" rel="noreferrer">roxannedukephotog.com</a>. Guests are also welcome to take their own photos throughout the day.
        </p>
      ),
    },
  ];

  const [faqOpen, setFaqOpen] = useState(() => faqs.map(() => false));
  const toggleFaq = (i) => setFaqOpen(prev => prev.map((v, idx) => (i === idx ? !v : v)));

  // Normalize API payload to local shape
  const normalize = (data) =>
    (data || []).map((r) => ({
      fullName: r.fullName,
      rsvp:
        (r.rsvp || '').toLowerCase() === 'yes'
          ? 'yes'
          : (r.rsvp || '').toLowerCase() === 'no'
          ? 'no'
          : '',
      dietary: (r.dietary || '').trim(),
      rowIndex: typeof r.rowIndex === 'number' ? r.rowIndex : undefined,
    }));

  useEffect(() => {
    (async () => {
      try {
        const data = await getBridalRsvp();
        setRows(normalize(data));
      } catch (e) {
        setBanner({ type: 'error', msg: e?.message || 'Failed to load RSVP.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (locked) {
      setBanner({
        type: 'info',
        msg: 'This page is now locked (RSVP deadline has passed). Your last saved responses are shown below.',
      });
    }
  }, [locked]);

  const canSubmit = useMemo(() => {
    if (locked || !rows.length) return false;
    return rows.every((r) => r.rsvp === 'yes' || r.rsvp === 'no');
  }, [rows, locked]);

  const setRsvp = (fullName, value) =>
    setRows((prev) => prev.map((r) => (r.fullName === fullName ? { ...r, rsvp: value } : r)));

  const setDietary = (fullName, value) =>
    setRows((prev) =>
      prev.map((r) => (r.fullName === fullName ? { ...r, dietary: value } : r))
    );

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

      await updateBridalRsvp(payload);

      const fresh = await getBridalRsvp();
      setRows(normalize(fresh));

      setBanner({ type: 'success', msg: 'Thanks! Your Bridal Shower RSVP has been updated.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setBanner({ type: 'error', msg: e?.message || 'Could not save your RSVP.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="bg-bridal min-h-dvh flex flex-col pt-[var(--nav-h)]">
      {/* Banner under navbar */}
      {banner && (
        <div
          className={`sticky top-[var(--nav-h)] z-40 w-full border-b px-4 py-3 text-center bg-[#E497A3]/90 border-rose text-white`}
          role="status"
          aria-live="polite"
        >
          {banner.msg}
        </div>
      )}

      <section className="flex-1 max-w-6xl mx-auto px-5 sm:px-6 md:px-8 py-10 md:py-12">
        {/* Page header */}
        <div className="text-center mb-8 md:mb-10">
          <Image
            src="/images/bridal-shower-champagne-tower.svg"
            alt="Champagne tower"
            width={97}
            height={150}
            className="mx-auto h-37 w-auto animate-wipeIn"
            priority
          />
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl">Ashley’s Bridal Shower</h1>
          <p className="mt-4 text-xl md:text-2xl">October 26, 2025</p>
          <p className="mt-4 text-sm md:text-base">Please RSVP by <span className="font-semibold">September 20th</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] gap-8 md:gap-10 items-start">
          {/* Left: portrait */}
          <div className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[560px] lg:h-[640px] overflow-hidden">
            <Image
              src="/images/bridal-photo.jpg"
              alt="Bridal portrait"
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 768px) 100vw, 380px"
              className="object-cover"
              priority={false}
            />
          </div>

          {/* Right: RSVP cards */}
          <div className="flex flex-col gap-6 md:gap-7">
            {loading && <div className="text-center text-sm opacity-70">Loading your invitation…</div>}

            {!loading && rows.length === 0 && (
              <div className="text-center text-sm opacity-70">
                No bridal shower invitation was found for your login.
              </div>
            )}

            {!loading && rows.map((g, idx) => {
              const yes = g.rsvp === 'yes';
              const no = g.rsvp === 'no';

              return (
                <article key={(g.rowIndex ?? idx) + g.fullName} className="border border-rose bg-transparent px-5 py-5 md:px-6 md:py-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl mb-3">{g.fullName}</h3>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => !locked && setRsvp(g.fullName, 'yes')}
                      aria-pressed={yes}
                      disabled={locked || saving}
                      className={`px-4 py-2 text-xs md:text-sm tracking-wide border transition hover:font-bold cursor-pointer ${
                        yes ? 'bg-[#E497A3] text-white border-[#E497A3]' : 'bg-transparent border-rose'
                      } ${locked ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-95'}`}
                    >
                      Happily Attending
                    </button>

                    <button
                      type="button"
                      onClick={() => !locked && setRsvp(g.fullName, 'no')}
                      aria-pressed={no}
                      disabled={locked || saving}
                      className={`px-4 py-2 text-xs md:text-sm tracking-wide border transition hover:font-bold cursor-pointer ${
                        no ? 'bg-rose text-white border-rose' : 'bg-transparent border-rose'
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
                      onChange={(e) => setDietary(g.fullName, e.target.value)}
                      disabled={locked || saving}
                      className="w-full bg-transparent border-b border-rose py-1 text-sm md:text-base focus:outline-none disabled:opacity-60"
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
                  className={`w-full sm:w-auto px-6 py-2 text-sm tracking-wide border transition hover:font-bold cursor-pointer ${
                    !canSubmit || saving ? 'opacity-60 cursor-not-allowed border-rose text-rose' : 'bg-rose text-white border-rose hover:opacity-95'
                  }`}
                >
                  {saving ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-8">
          <div className="flex items-center gap-6 md:gap-8">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#cbb199]/60 to-transparent" />
            <Image src="/images/swans_bridal.svg" alt="divider swans" width={96} height={39} className="h-8 w-auto opacity-80" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#cbb199]/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* FAQ Info Section */}
      <section id="more-info">
        <section id="faq" className="py-10 md:py-14 scroll-mt-24">
          <div className="max-w-3xl md:max-w-4xl mx-auto px-4">
            {faqs.map((item, i) => {
              const isOpen = faqOpen[i];
              const panelId = `faq-panel-${i}`;
              const btnId = `faq-button-${i}`;

              return (
                <div key={i} className="relative border-b border-[#E497A3]/70 last:border-0">
                  <button
                    id={btnId}
                    type="button"
                    aria-controls={panelId}
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(i)}
                    className="group w-full flex items-start justify-between gap-3 py-3 md:py-3.5 px-1 -mx-1 text-left rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E497A3]/25 cursor-pointer"
                  >
                    <span className="block flex-1 text-sm sm:text-base md:text-[17px] leading-6">
                      {item.q}
                    </span>
                    <svg
                      className={`mt-[2px] h-4 w-4 shrink-0 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''} opacity-90`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className={`grid transition-[grid-template-rows] duration-250 ease-out ${isOpen ? 'grid-rows-[1fr] mt-1.5 md:mt-2' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="text-[13.5px] sm:text-[15px] leading-6 text-left text-[#6c7276]/90">
                        {item.content ? item.content({ href: '#', children: null }, A) : <p>{item.a}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <footer className='bg-rose-200'>
        <div className="bg-rose py-10 text-center text-white">
          <Image
            src="/images/aj_white.svg"
            alt="Monogram"
            width={64}
            height={64}
            className="mx-auto mb-3 opacity-90"
          />
          <div className="text-xs opacity-95">© {yearRef.current} by Ashley Ottogalli</div>
        </div>
      </footer>
    </main>
  );
}
