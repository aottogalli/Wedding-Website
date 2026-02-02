'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const TRIGGER_PX = 1; // flip as soon as scrolling starts

export default function Navbar() {
  const pathname = usePathname();
  const { guest, logout } = useAuth();

  // Gate auth-dependent UI until after mount to avoid hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (pathname === '/login') return null;

  const isHome = pathname === '/';

  // refs
  const ioRef = useRef(null);
  const rafRef = useRef(0);
  const overHeroRef = useRef(true);

  // state
  const [solid, setSolid] = useState(() => !isHome);
  const [open, setOpen] = useState(false);

  const setSolidSafe = useCallback((v) => {
    setSolid((p) => (p === v ? p : v));
  }, []);

  useEffect(() => {
    const scrollingEl =
      document.scrollingElement ||
      document.documentElement ||
      document.body;

    const cleanup = () => {
      try { ioRef.current?.disconnect(); } catch {}
      ioRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      try { scrollingEl.removeEventListener('scroll', onScroll); } catch {}
    };

    if (!isHome) { // inner pages always solid
      setSolidSafe(true);
      return cleanup;
    }

    const compute = () => {
      const top = scrollingEl.scrollTop || 0;
      const nextSolid = !overHeroRef.current || top > TRIGGER_PX;
      setSolidSafe(nextSolid);
    };

    const sentinel =
      document.getElementById('nav-sentinel') ||
      document.getElementById('hero');

    if (sentinel) {
      ioRef.current = new IntersectionObserver(
        (entries) => {
          overHeroRef.current = !!entries[0]?.isIntersecting;
          compute();
        },
        { root: null, threshold: 0, rootMargin: '-1px 0px 0px 0px' }
      );
      ioRef.current.observe(sentinel);
    } else {
      overHeroRef.current = false;
    }

    function onScroll() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    }

    compute(); // correct initial client paint
    scrollingEl.addEventListener('scroll', onScroll, { passive: true });

    return cleanup;
  }, [isHome, setSolidSafe]);

  const hasRehearsal = Array.isArray(guest?.invitedToRehearsalDinner) ? guest.invitedToRehearsalDinner.length > 0 : !!guest?.invitedToRehearsalDinner;

  // UI classes
  const lightOverHero = isHome && !solid;
  const headerBg     = lightOverHero ? 'bg-transparent' : 'bg-white/95 backdrop-blur';
  const headerBorder = lightOverHero ? '' : 'border-b border-black/5';
  const linkColorCls = lightOverHero ? 'text-white' : 'text-[#6c7276]';
  const linkHover    = 'hover:font-bold';
  const linkBase     = 'px-1 text-sm font-trajan transition-colors duration-300';
  const link         = `${linkBase} ${linkColorCls} ${linkHover}`;

  const logoStyle = lightOverHero
    ? { filter: 'brightness(0) invert(1)', opacity: 0.95 }
    : { filter: 'grayscale(1) brightness(0.25) saturate(0)', opacity: 0.9 };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${headerBg} ${headerBorder}`}
      data-solid={solid ? 'true' : 'false'}
    >
      <nav className="h-12 md:h-14">
        <div className="mx-auto max-w-6xl h-full px-4 sm:px-6 md:px-8 flex items-center justify-between">
          {/* Brand */}
          <Link href="/#hero" className="flex items-center" aria-label="Go to start">
            <Image
              src="/images/aj_champagne.svg"
              alt="A&J"
              width={76}
              height={80}
              priority
              className="h-6 md:h-7 w-auto transition-[filter,opacity] duration-500"
              style={logoStyle}
            />
          </Link>

          {/* Center links — lg+ only */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-10">
            <Link href="/#hero" className={link}>Home</Link>
            <Link href="/#itinerary" className={link}>Itinerary</Link>
            <Link href="/#faq" className={link}>Q+A</Link>
            <Link href="/weddingRSVP" className={link}>RSVP</Link>
            {mounted && hasRehearsal && (
              <Link href="/rehearsalDinnerRSVP" className={link}>
                Rehearsal&nbsp;RSVP
              </Link>
            )}
          </div>

          {/* Right (desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            {mounted && guest && (
              <button
                type="button"
                onClick={logout}
                className={`text-sm font-trajan ${linkColorCls} ${linkHover} transition-colors cursor-pointer`}
              >
                Logout {guest.firstName}
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            className={`lg:hidden cursor-pointer inline-flex h-9 w-9 items-center justify-center ${linkColorCls} ${linkHover}`}
            onClick={() => setOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-[80%] max-w-[320px] bg-white shadow-xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center text-[#6c7276] hover:font-bold"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>

          <nav className="pt-12 pb-8 flex flex-col divide-y divide-black/10 text-[#6c7276] font-trajan tracking-[0.28em]">
            <Link href="/#hero"      onClick={() => setOpen(false)} className="block w-full px-6 py-5 text-base hover:bg-black/5">Home</Link>
            <Link href="/#itinerary" onClick={() => setOpen(false)} className="block w-full px-6 py-5 text-base hover:bg-black/5">Itinerary</Link>
            <Link href="/#faq"       onClick={() => setOpen(false)} className="block w-full px-6 py-5 text-base hover:bg-black/5">Q+A</Link>
            <Link href="/weddingRSVP" onClick={() => setOpen(false)} className="block w-full px-6 py-5 text-base hover:bg-black/5">RSVP</Link>

            {mounted && hasRehearsal && (
              <Link href="/rehearsalDinnerRSVP" onClick={() => setOpen(false)} className="block w-full px-6 py-5 text-base hover:bg-black/5">
                Rehearsal&nbsp;RSVP
              </Link>
            )}
            {mounted && guest && (
              <button
                type="button"
                onClick={() => { setOpen(false); logout(); }}
                className="text-left block w-full px-6 py-5 text-base hover:bg-black/5"
              >
                Logout {guest.firstName}
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
