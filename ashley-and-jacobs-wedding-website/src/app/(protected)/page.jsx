'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback, useRef as useReactRef } from 'react';
import Image from 'next/image';

/* ---------------- FAQ data ---------------- */

const FAQS = [
  {
    q: 'When and where is the wedding?',
    content: (A) => (
      <p className="text-white/90">
        The ceremony will take place at <strong>St. Patrick&apos;s Catholic Church</strong> at <strong>12:00 PM</strong>.
        The reception will follow at <strong>The Royal Ambassador</strong>. For timing and addresses, please see the{' '}
        <A href="#itinerary">itinerary</A>.
      </p>
    ),
  },
  {
    q: 'What time should I arrive?',
    a: 'Please arrive 15–20 minutes before the ceremony to allow time for seating. The church was constructed in the 18th century, so please plan accordingly for entry and seating.',
  },
  {
    q: 'What is the dress code?',
    content: () => (
      <p className="text-white/90">
        <strong>Formal Attire</strong> with a light, spring <em>garden</em> feel. Think airy fabrics and soft,
        nature-inspired tones—pastels and subtle florals encouraged. For men, a classic black tuxedo is always welcome,
        but a dark suit (navy, charcoal, or black) is absolutely perfect as well. Please avoid <strong>white</strong> and{' '}
        <strong>champagne</strong> (reserved for the bridal party).
      </p>
    ),
  },
  { q: 'Can I bring a guest?', a: 'We kindly ask that only the guests listed on your invitation attend.' },
  {
    q: 'Is there parking at the venue?',
    content: () => (
      <p className="text-white/90">
        Yes, complimentary on-site parking is available at both the church and the reception venue. If the church lot is
        full, you may use the lot at <strong>St. Patrick’s Catholic Elementary School</strong> across the street.
      </p>
    ),
  },
  {
    q: 'Do you have a hotel block?',
    content: (A) => (
      <p className="text-white/90">
        Yes—Hampton Inn &amp; Suites by Hilton Bolton. See the <A href="#travel">Travel &amp; Accommodations</A> section
        for details and the booking link.
      </p>
    ),
  },
  {
    q: 'What type of food will be served?',
    a: 'A multi-course Italian dinner will be served. Later in the evening, enjoy a midnight buffet featuring a Portuguese seafood station along with Italian and Portuguese pastries.',
  },
  {
    q: 'Can I make dietary requests?',
    a: 'Absolutely—please note any dietary restrictions when you RSVP and we will do our best to accommodate.',
  },
  { q: 'Will there be an open bar?', a: 'Yes! Beer, wine, and spirits will be served during cocktail hour and the reception.' },
  { q: 'What is the weather like in May in Caledon?', a: 'Typically mild (10–20°C / 50–68°F). We suggest bringing a light jacket for the evening.' },
  { q: 'Can I take photos during the ceremony?', a: 'We kindly request an unplugged ceremony—please keep phones away until the reception.' },
  { q: 'Do you have a registry?', a: 'We kindly prefer monetary gifts.' },
  { q: 'How do I RSVP?', a: 'Please RSVP through the website on the RSVP event pages.' },
];

/* ---------------- FAQ component (modern header, keeps your line style) ---------------- */

function FaqSection() {
  const [open, setOpen] = useState(() => FAQS.map(() => false));
  const allOpen = open.every(Boolean);

  const toggle = (i) => setOpen((prev) => prev.map((v, idx) => (i === idx ? !v : v)));
  const setAll = (val) => setOpen(FAQS.map(() => val));

  const A = ({ href, children }) => (
    <a href={href} className="underline decoration-white/40 underline-offset-4 hover:decoration-white hover:font-bold transition">
      {children}
    </a>
  );

  return (
    <section id="faq" className="bg-green text-white scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-white/80 tracking-[0.28em] text-[11px] sm:text-xs">DETAILS</p>
          <h2 className="mt-3 text-champagne font-altitude text-3xl sm:text-4xl md:text-5xl leading-tight">
            Questions &amp; Answers
          </h2>
          <p className="mt-3 text-white/85 text-sm sm:text-base max-w-[54ch] mx-auto">
            Everything guests usually ask—kept simple and in one place.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="px-4 py-2 text-xs sm:text-sm tracking-wide border border-white/30 text-white/95 hover:border-white/60 transition rounded-none"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="px-4 py-2 text-xs sm:text-sm tracking-wide border border-white/30 text-white/95 hover:border-white/60 transition rounded-none"
            >
              Collapse
            </button>
            <span className="sr-only">{allOpen ? 'All expanded' : 'Not all expanded'}</span>
          </div>
        </div>

        <div className="mt-2">
          {FAQS.map((item, i) => {
            const isOpen = open[i];
            const panelId = `faq-panel-${i}`;
            const btnId = `faq-button-${i}`;

            return (
              <div key={i} className="relative">
                <div className="h-px w-full bg-white/70" />
                <button
                  id={btnId}
                  type="button"
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  onClick={() => toggle(i)}
                  className="group w-full flex items-start justify-between gap-4 py-4 sm:py-4.5 px-1 -mx-1 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 cursor-pointer"
                >
                  <span className="block flex-1 text-[14px] sm:text-[15px] md:text-[16px] leading-6 text-white/95">
                    {item.q}
                  </span>
                  <svg
                    className={`mt-[2px] h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-90`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="text-[13.5px] sm:text-[14.5px] leading-6 text-left text-white/90 pr-2">
                      {item.content ? item.content(A) : <p>{item.a}</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="h-px w-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- helpers (access + jwt decode) ---------------- */

function safeParseJwt(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  const keysToTry = ['token', 'authToken', 'jwt', 'guestToken', 'rsvpToken', 'weddingToken'];
  for (const k of keysToTry) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

/* ---------------- Page ---------------- */

export default function WeddingWebsite() {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const heroRef = useRef(null);

  // show rehearsal link only if we can confirm access from stored token
  const [canSeeRehearsal, setCanSeeRehearsal] = useState(false);

  // wipe-in triggers
  const [ourStoryShown, setOurStoryShown] = useState(false);
  const [itineraryShown, setItineraryShown] = useState(false);
  const [travelShown, setTravelShown] = useState(false);

  const ourStoryRef = useRef(null);
  const itineraryRef = useRef(null);
  const travelRef = useRef(null);

  // hash scrolling (client only)
  useEffect(() => {
    const doHashScroll = () => {
      const raw = window.location.hash.replace('#', '');
      if (!raw) return;
      const el = document.getElementById(decodeURIComponent(raw));
      if (!el) return;
      const offset = window.innerWidth >= 768 ? 64 : 56;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    doHashScroll();
    window.addEventListener('hashchange', doHashScroll);
    return () => window.removeEventListener('hashchange', doHashScroll);
  }, []);

  // countdown
  useEffect(() => {
    const targetDate = new Date('2026-05-09T12:00:00');
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) {
        setDays(0);
        setHours(0);
        setMinutes(0);
        return;
      }
      setDays(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      setMinutes(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // access check from localStorage token (best-effort)
  useEffect(() => {
    const tok = getStoredToken();
    const payload = safeParseJwt(tok);
    const invited =
      payload?.guest?.invitedToRehearsalDinner ??
      payload?.invitedToRehearsalDinner ??
      payload?.guest?.rehearsalDinner ??
      false;

    setCanSeeRehearsal(Boolean(invited));
  }, []);

  // wipe-in observers
  useEffect(() => {
    const el = ourStoryRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOurStoryShown(true);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = itineraryRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setItineraryShown(true);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = travelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTravelShown(true);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollToStart = useCallback(() => {
    const el = document.getElementById('hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const yearRef = useReactRef(new Date().getFullYear());

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        id="hero"
        ref={heroRef}
        className="relative h-[100svh] md:h-[100dvh] min-h-[560px] w-full overflow-hidden -mb-[2px] pt-10 md:pt-12"
      >
        <div className="absolute inset-0 will-change-transform animate-kenburns">
          <Image
            src="/images/jacob_and_ashley_hero.jpg"
            alt="Ashley and Jacob"
            fill
            sizes="100vw"
            className="object-cover object-[center_30%] md:object-center"
            quality={100}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/55 pointer-events-none" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <p className="text-champagne tracking-[0.35em] text-xs sm:text-sm md:text-base mb-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            WE&apos;RE GETTING MARRIED
          </p>

          <h1 className="text-champagne font-altitude drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)] text-3xl sm:text-4xl md:text-[46px] lg:text-[56px] leading-tight">
            Ashley Ottogalli <span className="mx-2 md:mx-3">&</span> Jacob Marcantonio
          </h1>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Link
              href="/weddingRSVP"
              prefetch={false}
              className="text-champagne/95 text-[11px] sm:text-xs md:text-sm tracking-[0.28em] uppercase underline decoration-transparent underline-offset-8 hover:font-bold transition"
            >
              RSVP
            </Link>

            {canSeeRehearsal && (
              <>
                <span className="hidden sm:inline text-white/35">•</span>
                <Link
                  href="/rehearsalDinnerRSVP"
                  prefetch={false}
                  className="text-champagne/95 text-[11px] sm:text-xs md:text-sm tracking-[0.28em] uppercase underline decoration-transparent underline-offset-8 hover:font-bold transition"
                >
                  Rehearsal Dinner RSVP
                </Link>
              </>
            )}
          </div>
        </div>

        <a
          href="#next"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 text-white/90 z-30 opacity-85 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-0"
          aria-label="Scroll down"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 md:w-9 md:h-9 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </a>
      </section>

      {/* Monogram / Date */}
      <section id="next" className="bg-champagne py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Green-tinted aj_white.svg (mask technique) */}
            <div
              aria-hidden="true"
              className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] bg-green"
              style={{
                WebkitMaskImage: "url('/images/aj_white.svg')",
                maskImage: "url('/images/aj_white.svg')",
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />

            <h2 className="mt-5 text-green font-altitude text-3xl sm:text-4xl">May 9, 2026</h2>

            <div className="mt-7 grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              {[
                { href: '#our-story', label: 'OUR STORY' },
                { href: '#itinerary', label: 'ITINERARY' },
                { href: '#travel', label: 'TRAVEL' },
                { href: '#faq', label: 'FAQ' },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-4 py-2 text-[11px] sm:text-xs tracking-[0.22em] border border-green/30 text-green hover:border-green/60 transition hover:font-bold rounded-none text-center"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section
        className="relative w-full bg-cover bg-no-repeat bg-[center_45%] md:bg-center md:bg-fixed"
        style={{ backgroundImage: "url(/images/jacobandashleycountdown.jpg)" }}
      >
        <div className="relative py-12 sm:py-14 md:py-16">
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/35" />

          <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
            <h2 className="text-center text-champagne text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] mb-10 sm:mb-12">
              Until We Say I Do
            </h2>

            <div className="max-w-md mx-auto grid grid-cols-3 gap-5 sm:gap-8">
              {[
                { label: 'DAYS', value: days },
                { label: 'HOURS', value: hours },
                { label: 'MINUTES', value: minutes },
              ].map((t) => (
                <div key={t.label} className="text-center">
                  <div
                    suppressHydrationWarning
                    className="text-champagne font-altitude leading-none text-3xl sm:text-4xl md:text-5xl drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]"
                  >
                    {t.value}
                  </div>
                  <div className="mt-2 text-champagne tracking-[0.28em] text-[10px] sm:text-xs font-trajan opacity-95">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story (centered on all breakpoints) */}
      <section id="our-story" ref={ourStoryRef} className="bg-champagne scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div className="w-full">
              <div className="relative mx-auto w-[240px] sm:w-[280px] md:w-full md:max-w-[420px] aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/MiddlesexTower.jpg"
                  alt="Ashley & Jacob at Western"
                  fill
                  sizes="(max-width: 740px) 320px, (max-width: 1124px) 420px, 520px"
                  className="object-cover"
                  quality={100}
                />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl">Our Story</h2>
              <div className="mt-4 flex justify-center">
                <Image
                  src="/images/swans.svg"
                  alt="Swans"
                  width={110}
                  height={44}
                  className={`h-12 w-auto opacity-90 ${ourStoryShown ? 'animate-wipeIn' : 'wipe-start'}`}
                />
              </div>

              <div className="mt-6 space-y-5 text-base leading-7 max-w-[55ch] mx-auto">
                <p>
                  We met in 2018 during our second-last years at Western University. Ashley was studying software engineering while Jacob was studying finance.
                  Somehow, between exams and caffeine-fueled study sessions, we found each other.
                </p>
                <p>
                  What began as a spark quickly became something much more. Weekends together turned into years of laughter, late-night chats, and growing side by side.
                  In 2020, we added a little more love and a lot more fluff to our lives when we brought home our pup, Coco.
                </p>
                <p>
                  Even while living at home after school, we never skipped a weekend and never stopped being each other’s favourite person.
                  Nearly seven years later, we’re saying “I do” to a lifetime of love, dog walks, and everything in between.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section id="itinerary" ref={itineraryRef} className="bg-white py-14 sm:py-16 md:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl mb-10 sm:mb-12">Itinerary</h2>

          <div className="grid gap-8 sm:gap-10 md:grid-cols-3 text-center">
            {[
              { icon: '/images/church.svg', alt: 'Ceremony icon', title: 'Ceremony', text: "The ceremony will begin at 12:00 PM at St. Patrick's Church", w: 107, h: 123 },
              { icon: '/images/simple_champagne_tower.svg', alt: 'Cocktail hour icon', title: 'Cocktail Hour', text: 'Join us for cocktails starting at 5:00 PM at The Royal Ambassador', w: 95, h: 123 },
              { icon: '/images/wedding_cake.svg', alt: 'Reception icon', title: 'Reception', text: 'Our reception will follow immediately after cocktail hour', w: 109, h: 123 },
            ].map((c) => (
              <article key={c.title} className="border border-black/10 px-6 py-8 sm:py-10 rounded-none">
                <Image
                  src={c.icon}
                  alt={c.alt}
                  width={c.w}
                  height={c.h}
                  className={`h-16 w-auto mx-auto ${itineraryShown ? 'animate-wipeIn' : 'wipe-start'}`}
                />
                <h3 className="mt-5 text-2xl sm:text-3xl">{c.title}</h3>
                <p className="mt-3 text-base leading-6 tracking-wide max-w-[30ch] mx-auto text-black/75">{c.text}</p>
              </article>
            ))}
          </div>

          <h2 className="mt-14 sm:mt-16 md:mt-20 text-center text-3xl sm:text-4xl md:text-5xl mb-8">The Venues</h2>

          <div className="grid gap-8 md:gap-10">
            <article className="border border-black/10 rounded-none overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="relative h-[220px] sm:h-[260px] md:h-full min-h-[240px]">
                  <iframe
                    src="https://www.google.com/maps?q=11873%20The%20Gore%20Rd%2C%20Brampton%2C%20ON%20L6P%200B2&z=15&output=embed"
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    title="St Patrick's Roman Catholic Church map"
                  />
                </div>
                <div className="p-6 sm:p-8 text-center md:text-left flex flex-col justify-center">
                  <h3 className="text-2xl sm:text-3xl">St Patrick&apos;s Roman Catholic Church</h3>
                  <p className="mt-3 text-base leading-6 text-black/70">
                    11873 The Gore Rd<br />Brampton, ON<br />L6P 0B2
                  </p>
                  <a
                    href="https://maps.google.com/?q=11873%20The%20Gore%20Rd%20Brampton%20ON%20L6P%200B2"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-block px-5 py-2 text-xs sm:text-sm tracking-wide border border-black/20 text-black/80 hover:border-black/40 transition rounded-none hover:font-bold"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </article>

            <article className="border border-black/10 rounded-none overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="relative h-[220px] sm:h-[260px] md:h-full min-h-[240px] md:order-2">
                  <iframe
                    src="https://www.google.com/maps?q=15430%20Innis%20Lake%20Rd%2C%20Caledon%20East%2C%20ON%20L7C%201Z1&z=15&output=embed"
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    title="The Royal Ambassador map"
                  />
                </div>
                <div className="p-6 sm:p-8 text-center md:text-left flex flex-col justify-center md:order-1">
                  <h3 className="text-2xl sm:text-3xl">The Royal Ambassador</h3>
                  <p className="mt-3 text-base leading-6 text-black/70">
                    15430 Innis Lake Rd<br />Caledon East, ON<br />L7C 1Z1
                  </p>
                  <a
                    href="https://maps.google.com/?q=15430%20Innis%20Lake%20Rd%20Caledon%20East%20ON%20L7C%201Z1"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-block px-5 py-2 text-xs sm:text-sm tracking-wide border border-black/20 text-black/80 hover:border-black/40 transition rounded-none hover:font-bold"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#cbb199]/60 to-transparent" />
            <Image src="/images/swans.svg" alt="divider swans" width={96} height={40} className="h-8 w-auto opacity-80" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#cbb199]/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* Travel (buttons bottom-aligned + wipe icons) */}
      <section id="travel" ref={travelRef} className="bg-green text-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-16 lg:py-20">
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl mb-10 md:mb-14">Travel &amp; Accommodations</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 auto-rows-fr">
            {/* 1 */}
            <article className="flex flex-col items-center text-center border border-white/18 p-6 sm:p-7 lg:p-9 rounded-none">
              <Image
                src="/images/suitcase.svg"
                alt="Suitcase icon"
                width={134}
                height={123}
                className={`h-14 sm:h-16 lg:h-20 w-auto ${travelShown ? 'animate-wipeIn' : 'wipe-start'}`}
              />
              <h3 className="mt-5 text-2xl sm:text-3xl">Nearest Airport</h3>

              <div className="mt-3 flex-1 w-full flex flex-col items-center">
                <p className="text-base leading-7 text-white/90 max-w-[36ch]">
                  The nearest airport is <strong>Toronto Pearson International (YYZ)</strong>, approximately 30 minutes from the venue.
                </p>

                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:text-base tracking-wide text-white/85">
                  <span className="opacity-75">Code</span><span>YYZ</span>
                  <span className="opacity-75">Distance</span><span>~30 min drive</span>
                </div>

                <div className="mt-auto pt-6" aria-hidden="true" />
              </div>
            </article>

            {/* 2 */}
            <article className="flex flex-col items-center text-center border border-white/18 p-6 sm:p-7 lg:p-9 rounded-none">
              <Image
                src="/images/room_key.svg"
                alt="Room key icon"
                width={125}
                height={123}
                className={`h-14 sm:h-16 lg:h-20 w-auto ${travelShown ? 'animate-wipeIn' : 'wipe-start'}`}
              />
              <h3 className="mt-5 text-2xl sm:text-3xl">Hampton Inn &amp; Suites by Hilton Bolton</h3>

              <div className="mt-3 flex-1 w-full flex flex-col items-center">
                <p className="text-base leading-7 text-white/90 max-w-[36ch]">
                  A reserved wedding block is available for our guests on <strong>May 9, 2026</strong>. Please reference the group when booking.
                </p>

                <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:text-base tracking-wide text-white/85">
                  <span className="opacity-75">Group</span><span>AMW</span>
                  <span className="opacity-75">Deadline</span><span>Apr 3, 2026</span>
                </div>

                <div className="mt-auto pt-6 w-full">
                  <a
                    href="https://www.hilton.com/en/book/reservation/deeplink/?ctyhocn=YYZBOHX&groupCode=CHHAMW&arrivaldate=2026-05-09&departuredate=2026-05-10&cid=OM,WW,HILTONLINK,EN,DirectLink&fromId=HILTONLINKDIRECT"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block w-full sm:w-auto bg-champagne text-green px-5 py-2 text-sm tracking-wide hover:opacity-90 transition hover:font-bold rounded-none"
                  >
                    Booking Link
                  </a>
                </div>
              </div>
            </article>

            {/* 3 */}
            <article className="flex flex-col items-center text-center border border-white/18 p-6 sm:p-7 lg:p-9 rounded-none">
              <Image
                src="/images/trolly.svg"
                alt="Hotel bell cart icon"
                width={97}
                height={123}
                className={`h-14 sm:h-16 lg:h-20 w-auto ${travelShown ? 'animate-wipeIn' : 'wipe-start'}`}
              />
              <h3 className="mt-5 text-2xl sm:text-3xl">Alternative Hotels</h3>

              <div className="mt-3 flex-1 w-full flex flex-col items-center">
                <p className="text-base leading-7 text-white/90 max-w-[36ch]">
                  Prefer a different stay? These nearby options are convenient to the venue and airport.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm sm:text-base text-white/90 w-full" role="list">
                  <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Element Vaughan Southwest</span>
                  <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Sheraton Toronto Airport</span>
                  <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Alt Hotel Toronto Airport</span>
                  <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Millcroft Inn &amp; Spa</span>
                </div>

                <div className="mt-auto pt-6 w-full">
                  <a
                    href="https://www.google.com/maps/search/hotels+near+Caledon+East+ON"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block w-full sm:w-auto bg-champagne text-green px-5 py-2 text-sm tracking-wide hover:opacity-90 transition hover:font-bold rounded-none"
                  >
                    Browse hotels
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* Footer */}
      <footer id="footer" className="relative isolate">
        <div className="relative h-[42vh] min-h-[280px] md:h-[52vh] overflow-hidden">
          <Image
            src="/images/footer3.jpg"
            alt="Ashley & Jacob Footer"
            fill
            priority={false}
            className="object-cover object-[50%_28%] md:object-[50%_34%] brightness-[1] contrast-[.98]"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/28 to-black/15" />

          <button
            type="button"
            onClick={scrollToStart}
            className="group absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-12 md:h-12
                      text-champagne/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
            aria-label="Back to the start"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 md:h-9 md:w-9 transition-transform duration-300 group-hover:-translate-y-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14 L12 6 L20 14" />
            </svg>
          </button>

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
            <Image src="/images/aj_champagne.svg" alt="AJ Monogram" width={153} height={160} className="w-24 sm:w-28 md:w-36 h-auto opacity-95" />
            <p suppressHydrationWarning className="mt-2 text-champagne/95 text-[10px] sm:text-[11px] md:text-xs tracking-[0.22em]">
              © {yearRef.current} by Ashley Ottogalli
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
