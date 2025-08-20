'use client';

import { useState, useEffect, useRef, useCallback, useRef as useReactRef } from 'react';
import Image from 'next/image';

/* ---------------- helpers ---------------- */

function smoothScrollTo(selector, { duration = 900, offset = 0 } = {}) {
  const el = typeof document !== 'undefined' ? document.querySelector(selector) : null;
  if (!el) return;

  const startY = window.pageYOffset;
  const targetY = startY + el.getBoundingClientRect().top - offset;
  const diff = targetY - startY;

  let start;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function step(ts) {
    if (!start) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    window.scrollTo(0, startY + diff * ease(t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------------- FAQ data & component ---------------- */

const FAQS = [
  {
    q: 'When and where is the wedding?',
    content: (A) => (
      <p className="text-white/90">
        The ceremony will take place at <strong>St. Patrick&apos;s Catholic Church</strong> at <strong>12:00 PM</strong>.
        The reception will follow at <strong>The Royal Ambassador</strong>. For timing and addresses,
        please see the <A href="#itinerary">itinerary</A>.
      </p>
    ),
  },
  { q: 'What time should I arrive?', a: 'Please arrive 15–20 minutes before the ceremony to allow time for seating. The church was constructed in the 18th century, so please plan accordingly for entry and seating.' },
  {
    q: 'What is the dress code?',
    content: () => (
      <>
        <p className="text-white/90">
          <strong>Formal Attire</strong> with a light, spring <em>garden</em> feel. Think airy fabrics and soft, nature-inspired tones—pastels and subtle florals encouraged.
          A classic black tuxedo is always welcome. Please avoid <strong>white</strong> and <strong>champagne</strong> (reserved for the bridal party).
        </p>
      </>
    ),
  },
  { q: 'Can I bring a guest?', a: 'We kindly ask that only the guests listed on your invitation attend.' },
  {
    q: 'Is there parking at the venue?',
    content: () => (
      <p className="text-white/90">
        Yes, complimentary on-site parking is available at both the church and the reception venue. If the church lot is full, you may use the lot at <strong>St. Patrick’s Catholic Elementary School</strong> across the street.
      </p>
    ),
  },
  {
    q: 'Do you have a hotel block?',
    content: (A) => (
      <p className="text-white/90">
        Yes—Hampton Inn &amp; Suites by Hilton Bolton. See the <A href="#travel">Travel &amp; Accommodations</A> section for details and the booking link.
      </p>
    ),
  },
  { q: 'What type of food will be served?', a: 'A multi-course Italian dinner will be served. Later in the evening, enjoy a midnight buffet featuring a Portuguese seafood station along with Italian and Portuguese pastries.' },
  { q: 'Can I make dietary requests?', a: 'Absolutely—please note any dietary restrictions when you RSVP and we will do our best to accommodate.' },
  { q: 'Will there be an open bar?', a: 'Yes! Beer, wine, and spirits will be served during cocktail hour and the reception.' },
  { q: 'What is the weather like in May in Caledon?', a: 'Typically mild (10–20°C / 50–68°F). We suggest bringing a light jacket for the evening.' },
  { q: 'Can I take photos during the ceremony?', a: 'We kindly request an unplugged ceremony—please keep phones away until the reception.' },
  { q: 'Do you have a registry?', a: 'We kindly prefer monetary gifts.' },
  { q: 'How do I RSVP?', a: 'Please RSVP through the website on the RSVP event pages.' },
];

function FaqSection() {
  const [open, setOpen] = useState(() => FAQS.map(() => false));
  const toggle = (i) => setOpen((prev) => prev.map((v, idx) => (i === idx ? !v : v)));

  const A = ({ href, children }) => (
    <a href={href} className="underline decoration-white/60 underline-offset-4 hover:decoration-white">
      {children}
    </a>
  );

  return (
    <section id="faq-details" className="bg-green text-white py-10 md:py-14 scroll-mt-24">
      <div className="max-w-3xl md:max-w-4xl mx-auto px-4">
        {FAQS.map((item, i) => {
          const isOpen = open[i];
          const panelId = `faq-panel-${i}`;
          const btnId = `faq-button-${i}`;

          return (
            <div key={i} className="relative">
              <div className="h-px w-full bg-white/70 mb-2.5" />
              <button
                id={btnId}
                type="button"
                aria-controls={panelId}
                aria-expanded={isOpen}
                onClick={() => toggle(i)}
                className="group w-full flex items-start justify-between gap-3 py-3 md:py-3.5 px-1 -mx-1 text-left rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 cursor-pointer"
              >
                <span className="block flex-1 text-sm sm:text-base md:text-[17px] leading-6">{item.q}</span>
                <svg
                  className={`mt-[2px] h-4 w-4 shrink-0 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''} opacity-90`}
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
                className={`grid transition-[grid-template-rows] duration-250 ease-out ${
                  isOpen ? 'grid-rows-[1fr] mt-1.5 md:mt-2' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="text-[13.5px] sm:text-[15px] leading-6 text-left text-white/90">
                    {item.content ? item.content(A) : <p>{item.a}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="mt-1 h-px w-full bg-white/70" />
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function WeddingWebsite() {
  const [days, setDays] = useState(380);
  const [hours, setHours] = useState(29);
  const [minutes, setMinutes] = useState(0);
  const [ourStoryShown, setOurStoryShown] = useState(false);
  const [itineraryShown, setItineraryShown] = useState(false);
  const [travelShown, setTravelShown] = useState(false);

  const heroRef = useRef(null);
  const textRef = useRef(null);
  const ourStorySectionRef = useRef(null);
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
        setDays(0); setHours(0); setMinutes(0);
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

  // hero text reveal
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current || !textRef.current) return;
      const heroPosition = heroRef.current.getBoundingClientRect();
      const scrollProgress = Math.min(Math.max(1 - heroPosition.top / window.innerHeight, 0), 1);
      const moveDistance = 300 - scrollProgress * 300;
      textRef.current.style.transform = `translateY(${moveDistance}px)`;
      textRef.current.style.opacity = scrollProgress;
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // intersections
  useEffect(() => {
    const el = ourStorySectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setOurStoryShown(true);
        io.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = itineraryRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setItineraryShown(true);
        io.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = travelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTravelShown(true);
        io.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ourStoryContainerStyle = {
    transform: ourStoryShown ? 'translateY(0)' : 'translateY(20px)',
    opacity: ourStoryShown ? 1 : 0,
    transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease',
    willChange: 'transform, opacity',
  };
  const ItineraryContainerStyle = {
    transform: itineraryShown ? 'translateY(0)' : 'translateY(20px)',
    opacity: itineraryShown ? 1 : 0,
    transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease',
    willChange: 'transform, opacity',
  };
  const TravelContainerStyle = {
    transform: travelShown ? 'translateY(0)' : 'translateY(20px)',
    opacity: travelShown ? 1 : 0,
    transition: 'transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease',
    willChange: 'transform, opacity',
  };

  const scrollToStart = useCallback(() => {
    const el = document.getElementById('hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // stable year to avoid hydration edge cases
  const yearRef = useReactRef(new Date().getFullYear());

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        id="hero"
        ref={heroRef}
        className="relative h-[100svh] md:h-[100dvh] min-h-[560px] w-full overflow-hidden -mb-[2px] pt-10 md:pt-12"
      >
        <div id="nav-sentinel" style={{ position: 'absolute', top: '52vh', left: 0, width: 1, height: 1 }} />
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
        <div ref={textRef} className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <p
            className="text-champagne tracking-[0.35em] text-xs sm:text-sm md:text-base mb-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] opacity-0 animate-fadeDown"
            style={{ animationDelay: '120ms' }}
          >
            WE&apos;RE GETTING MARRIED
          </p>
          <h1 className="text-champagne font-altitude drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)] text-3xl sm:text-4xl md:text-[46px] lg:text-[56px] leading-tight opacity-0 animate-fadeUp">
            Ashley Ottogalli <span className="mx-2 md:mx-3">&</span> Jacob Marcantonio
          </h1>
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

      {/* Monogram */}
      <section id="next" className="bg-champagne py-16" style={{ padding: '4rem 0' }}>
        <div className="flex flex-col items-center justify-center mx-auto" style={{ maxWidth: '300px' }}>
          <div style={{ width: '150px', height: '150px', position: 'relative' }}>
            <Image src="/images/monogram.png" alt="A&J Monogram" fill sizes="(max-width: 640px) 180px, 265.6px" className="object-contain" priority />
          </div>
          <h1 className="text-green" style={{ fontSize: '2rem' }}>May 9, 2026</h1>
        </div>
      </section>

      {/* Countdown */}
      <section className="relative w-full bg-cover bg-no-repeat bg-[center_45%] md:bg-center md:bg-fixed" style={{ backgroundImage: "url(/images/jacobandashleycountdown.jpg)" }}>
        <div className="min-h-[50vh] md:min-h-[60vh] py-10 md:py-14">
          <div className="absolute inset-0 bg-black/45 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/35 pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto px-4">
            <h2 className="text-center text-champagne text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)] mb-10 md:mb-14">Until We Say I Do</h2>
            <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-12 lg:gap-16">
              {[
                { label: 'DAYS', value: days },
                { label: 'HOURS', value: hours },
                { label: 'MINUTES', value: minutes },
              ].map((t) => (
                <div key={t.label} className="text-center min-w-[120px]">
                  <div suppressHydrationWarning className="text-champagne font-altitude leading-none text-2xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)]">{t.value}</div>
                  <div className="mt-2 text-champagne tracking-[0.35em] text-xs sm:text-sm md:text-base font-trajan">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="our-story" ref={ourStorySectionRef} className="relative z-20 -mt-12 md:-mt-16 bg-champagne">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-8">
          <div className="px-5 sm:px-8 md:px-10 py-10 md:py-12" style={ourStoryContainerStyle}>
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
              <div className="w-full place-self-center">
                <div className="relative mx-auto w-[220px] sm:w-[260px] md:w-[320px] lg:w-[360px] aspect-[3/4] overflow-hidden">
                  <Image
                    src="/images/MiddlesexTower.jpg"
                    alt="Ashley & Jacob at Western"
                    fill
                    sizes="(max-width: 740px) 320px, (max-width: 868px) 360px, (max-width: 1124px) 420px, 460px"
                    className="object-cover"
                    quality={100}
                    priority={false}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center text-center place-self-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl">Our Story</h2>
                <Image src="/images/swans.svg" alt="Swans" width={110} height={44} className={`mt-4 h-12 w-auto ${ourStoryShown ? 'animate-wipeIn' : 'wipe-start'}`} priority={false} />
                <div className="mt-6 space-y-5 max-w-[46ch] md:max-w-none text-base leading-6">
                  <p>We met in 2018 during our second-last years at Western University. Ashley was studying software engineering while Jacob was studying finance. Somehow, between exams and caffeine-fueled study sessions, we found each other.</p>
                  <p>What began as a spark quickly became something much more. Weekends together turned into years of laughter, late-night chats, and growing side by side. In 2020, we added a little more love and a lot more fluff to our lives when we brought home our pup, Coco.</p>
                  <p>Even while living at home after school, we never skipped a weekend and never stopped being each other’s favourite person. Nearly seven years later, we’re saying “I do” to a lifetime of love, dog walks, and everything in between.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary & Venues */}
      <div className="h-8 sm:h-10 bg-gradient-to-b from-[#f9f0df] via-[#f6eee1] to-white" />
      <section id="itinerary" ref={itineraryRef} className="bg-white py-16 md:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-8">
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl mb-10 md:mb-12">Itinerary</h2>
          <div className="grid gap-10 sm:gap-12 md:gap-14 md:grid-cols-3 text-center" style={ItineraryContainerStyle}>
            <div className="flex flex-col items-center">
              <Image src="/images/church.svg" alt="Ceremony icon" width={107} height={123} className={`h-16 w-auto sm:h-20 ${itineraryShown ? 'animate-wipeIn' : 'wipe-start'}`} />
              <h3 className="mt-5 text-2xl sm:text-3xl">Ceremony</h3>
              <p className="mt-3 text-base leading-6 tracking-wide max-w-[28ch]">The ceremony will begin at 12:00 PM at St. Patrick&apos;s Church</p>
            </div>
            <div className="flex flex-col items-center">
              <Image src="/images/simple_champagne_tower.svg" alt="Cocktail hour icon" width={95} height={123} className={`h-16 w-auto sm:h-20 ${itineraryShown ? 'animate-wipeIn' : 'wipe-start'}`} />
              <h3 className="mt-5 text-2xl sm:text-3xl">Cocktail Hour</h3>
              <p className="mt-3 text-base leading-6 tracking-wide max-w-[28ch]">Join us for cocktails starting at 5:00 PM at The Royal Ambassador</p>
            </div>
            <div className="flex flex-col items-center">
              <Image src="/images/wedding_cake.svg" alt="Reception icon" width={109} height={123} className={`h-16 w-auto sm:h-20 ${itineraryShown ? 'animate-wipeIn' : 'wipe-start'}`} />
              <h3 className="mt-5 text-2xl sm:text-3xl">Reception</h3>
              <p className="mt-3 text-base leading-6 tracking-wide max-w-[28ch]">Our reception will follow immediately after cocktail hour</p>
            </div>
          </div>

          <h2 className="mt-14 sm:mt-16 md:mt-20 text-center text-3xl sm:text-4xl md:text-5xl mb-8">The Venues</h2>
          <div className="mt-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-center text-center">
            <div className="order-1">
              <div className="relative w-full h-[200px] sm:h-[220px] md:h-[240px] lg:h-[260px] overflow-hidden">
                <iframe
                  src="https://www.google.com/maps?q=11873%20The%20Gore%20Rd%2C%20Brampton%2C%20ON%20L6P%200B2&z=15&output=embed"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  title="St Patrick's Roman Catholic Church map"
                />
              </div>
            </div>
            <div className="order-2">
              <h3 className="text-2xl sm:text-3xl">St Patrick&apos;s Roman Catholic Church</h3>
              <p className="mt-2 text-base leading-6">11873 The Gore Rd<br />Brampton, ON<br />L6P 0B2</p>
              <a href="https://maps.google.com/?q=11873%20The%20Gore%20Rd%20Brampton%20ON%20L6P%200B2" target="_blank" rel="noreferrer" className="inline-block mt-2 text-[#75897b] hover:underline">
                Open in Google Maps →
              </a>
            </div>
            <div className="order-3 md:order-3">
              <div className="relative w-full h-[200px] sm:h-[220px] md:h-[240px] lg:h-[260px] overflow-hidden">
                <iframe
                  src="https://www.google.com/maps?q=15430%20Innis%20Lake%20Rd%2C%20Caledon%20East%2C%20ON%20L7C%201Z1&z=15&output=embed"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  title="The Royal Ambassador map"
                />
              </div>
            </div>
            <div className="order-4 md:order-4">
              <h3 className="text-2xl sm:text-3xl">The Royal Ambassador</h3>
              <p className="mt-2 text-base leading-6">15430 Innis Lake Rd<br />Caledon East, ON<br />L7C 1Z1</p>
              <a href="https://maps.google.com/?q=15430%20Innis%20Lake%20Rd%20Caledon%20East%20ON%20L7C%201Z1" target="_blank" rel="noreferrer" className="inline-block mt-2 text-[#75897b] hover:underline">
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-8">
          <div className="flex items-center gap-6 md:gap-8">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#cbb199]/60 to-transparent" />
            <Image src="/images/swans.svg" alt="divider swans" width={96} height={40} className="h-8 w-auto opacity-80" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#cbb199]/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* Travel */}
      <section id="travel" ref={travelRef} className="bg-green text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <h2 className="text-center text-3xl sm:text-4xl md:text-5xl mb-8 sm:mb-10 md:mb-14">Travel &amp; Accommodations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 auto-rows-fr" style={TravelContainerStyle}>
            {/* cards ... (unchanged from your version) */}
            {/* 1 */}
            <article className="flex flex-col items-center text-center bg-white/6 ring-1 ring-white/12 p-6 sm:p-7 lg:p-9 shadow-soft">
              <Image src="/images/suitcase.svg" alt="Suitcase icon" width={134} height={123} className={`h-14 sm:h-16 lg:h-20 w-auto ${travelShown ? 'animate-wipeIn' : 'wipe-start'}`} />
              <h3 className="mt-5 text-2xl sm:text-3xl">Nearest Airport</h3>
              <div className="mt-3 flex-1 min-h-[7.5rem] sm:min-h-[6.5rem] lg:min-h-[7.5rem] flex items-center justify-center">
                <p className="text-base leading-7 text-white/90 max-w-[36ch] text-center">
                  The nearest airport is <strong>Toronto Pearson International (YYZ)</strong>, approximately 30 minutes from the venue.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:text-base tracking-wide text-white/85">
                <span className="opacity-75">Code</span><span>YYZ</span>
                <span className="opacity-75">Distance</span><span>~30 min drive</span>
              </div>
            </article>
            {/* 2 */}
            <article className="flex flex-col items-center text-center bg-white/6 ring-1 ring-white/12 p-6 sm:p-7 lg:p-9 shadow-soft">
              <Image src="/images/room_key.svg" alt="Room key icon" width={125} height={123} className={`h-14 sm:h-16 lg:h-20 w-auto ${travelShown ? 'animate-wipeIn' : 'wipe-start'}`} />
              <h3 className="mt-5 text-2xl sm:text-3xl">Hampton Inn &amp; Suites by Hilton Bolton</h3>
              <div className="mt-3 flex-1 min-h-[7.5rem] sm:min-h-[6.5rem] lg:min-h-[7.5rem] flex items-center justify-center">
                <p className="text-base leading-7 text-white/90 max-w-[36ch] text-center">
                  A reserved wedding block is available for our guests on <strong>May 9, 2026</strong>. Please reference the group when booking.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:text-base tracking-wide text-white/85">
                <span className="opacity-75">Group</span><span>AMV</span>
                <span className="opacity-75">Deadline</span><span>Apr 3, 2026</span>
              </div>
              <a
                href="https://www.hilton.com/en/book/reservation/deeplink/?ctyhocn=YYZBOHX&groupCode=CHHAMW&arrivaldate=2026-05-09&departuredate=2026-05-10&cid=OM,WW,HILTONLINK,EN,DirectLink&fromId=HILTONLINKDIRECT"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block w-full sm:w-auto bg-champagne text-green px-5 py-2 text-sm tracking-wide hover:opacity-90 transition"
              >
                Booking Link
              </a>
            </article>
            {/* 3 */}
            <article className="flex flex-col items-center text-center bg-white/6 ring-1 ring-white/12 p-6 sm:p-7 lg:p-9 shadow-soft">
              <Image src="/images/trolly.svg" alt="Hotel bell cart icon" width={97} height={123} className={`h-14 sm:h-16 lg:h-20 w-auto ${travelShown ? 'animate-wipeIn' : 'wipe-start'}`} />
              <h3 className="mt-5 text-2xl sm:text-3xl">Alternative Hotels</h3>
              <div className="mt-3 flex-1 min-h-[7.5rem] sm:min-h-[6.5rem] lg:min-h-[7.5rem] flex items-center justify-center">
                <p className="text-base leading-7 text-white/90 max-w-[36ch] text-center">
                  Prefer a different stay? These nearby options are convenient to the venue and airport.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-sm sm:text-base text-white/90" role="list">
                <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Element Vaughan Southwest</span>
                <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Sheraton Toronto Airport</span>
                <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Alt Hotel Toronto Airport</span>
                <span role="listitem" className="flex items-start justify-center sm:justify-start text-center sm:text-left break-words before:content-['•'] before:mr-2 before:text-white/70">Millcroft Inn &amp; Spa</span>
              </div>
              <a
                href="https://www.google.com/maps/search/hotels+near+Caledon+East+ON"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block w-full sm:w-auto bg-champagne text-green px-5 py-2 text-sm tracking-wide hover:opacity-90 transition"
              >
                Browse hotels
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ Title banner */}
      <section id="faq" className="relative">
        <div className="h-[31vh] min-h-[200px] md:h-[35vh] bg-fixed bg-cover bg-center" style={{ backgroundImage: "url('/images/faqimage.jpg')" }}>
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
          <div className="relative z-10 flex h-full items-center justify-center px-4">
            <h2 className="text-champagne text-4xl sm:text-5xl md:text-6xl tracking-wide drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]">More Info</h2>
          </div>
        </div>
      </section>

      {/* FAQ list */}
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
            <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
