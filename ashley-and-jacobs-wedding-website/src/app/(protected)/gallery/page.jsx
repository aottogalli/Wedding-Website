'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

const EXT = 'jpg';
const BRIDAL_SHOWER_MORE_PHOTOS_URL =
  'https://roxannedukephotography.pic-time.com/-ashleysbridalshower2/gallery?inviteptoken2=AAAAAPMAAADVZ0RVGa481DGyZQscDfYa7A%2C%2C';

const ENGAGEMENT_COUNT = 30;
const BRIDAL_SHOWER_COUNT = 32;

// Engagement: 8 landscape (spread out)
const ENGAGEMENT_LANDSCAPE_SLOTS = new Set([1, 4, 7, 10, 13, 16, 22, 28]);

// Bridal Shower: 12 landscape (spread evenly)
const BRIDAL_LANDSCAPE_SLOTS = new Set([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 30, 32]);

// Eager-load first N thumbs to avoid “blank until click”
const EAGER_THUMBS = 14;

// Masonry tuning
const MASONRY_ROW_PX = 10; // smaller = smoother masonry; 8–12 is a good range

function buildGallery({ folder, label, count, landscapeSlots }) {
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1;
    const isLandscapeTile = landscapeSlots?.has(num);

    return {
      num,
      src: `/images/${folder}/${num}.${EXT}`,
      alt: `${label} photo ${num}`,
      tile: isLandscapeTile ? 'landscape' : 'portrait',
    };
  });
}

const GALLERIES = {
  'Engagement Photos': buildGallery({
    folder: 'engagement_photos',
    label: 'Engagement Photos',
    count: ENGAGEMENT_COUNT,
    landscapeSlots: ENGAGEMENT_LANDSCAPE_SLOTS,
  }),
  'Bridal Shower': buildGallery({
    folder: 'bridal_shower',
    label: 'Bridal Shower',
    count: BRIDAL_SHOWER_COUNT,
    landscapeSlots: BRIDAL_LANDSCAPE_SLOTS,
  }),
};

const GALLERY_KEYS = Object.keys(GALLERIES);

// More realistic ratios = less “weird cropping”
function aspectClass(tile) {
  // portrait = 2:3, landscape = 3:2
  return tile === 'portrait' ? 'aspect-[2/3]' : 'aspect-[3/2]';
}

// Slight upward bias for portraits helps keep faces in frame
function objectPosClass(tile) {
  return tile === 'portrait' ? 'object-[50%_35%]' : 'object-center';
}

export default function GalleryPage() {
  const [selectedGallery, setSelectedGallery] = useState('Engagement Photos');
  const images = useMemo(() => GALLERIES[selectedGallery] ?? [], [selectedGallery]);
  const isBridalShower = selectedGallery === 'Bridal Shower';

  // Best-effort blockers (won't stop screenshots/devtools)
  const block = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // Lightbox
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const closeBtnRef = useRef(null);

  const openAt = (i) => {
    setIndex(i);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const prev = () => setIndex((v) => (v - 1 + images.length) % images.length);
  const next = () => setIndex((v) => (v + 1) % images.length);

  // Reset lightbox when switching galleries
  useEffect(() => {
    setOpen(false);
    setIndex(0);
  }, [selectedGallery]);

  // Keyboard controls + lock scroll
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };

    window.addEventListener('keydown', onKey);
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, images.length]);

  // Scroll to grid after choosing a gallery
  const gridRef = useRef(null);
  const chooseGallery = (name) => {
    setSelectedGallery(name);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  // Cover image per gallery (use #1)
  const coverFor = (name) => GALLERIES[name]?.[0]?.src ?? null;

  /**
   * ✅ TRUE MASONRY:
   * We render a CSS grid with tiny auto-rows and then set grid-row-end span
   * based on actual card height (ResizeObserver).
   */
  const masonryGridRef = useRef(null);
  const itemRefs = useRef([]);

  const resizeMasonryItem = useCallback((item) => {
    if (!item || !masonryGridRef.current) return;

    const grid = masonryGridRef.current;
    const rowHeight = parseInt(getComputedStyle(grid).getPropertyValue('grid-auto-rows'), 10) || MASONRY_ROW_PX;
    const rowGap = parseInt(getComputedStyle(grid).getPropertyValue('gap'), 10) || 0;

    const content = item.querySelector('[data-masonry-content="true"]');
    if (!content) return;

    const contentHeight = content.getBoundingClientRect().height;
    const span = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));

    item.style.gridRowEnd = `span ${span}`;
  }, []);

  const resizeAll = useCallback(() => {
    itemRefs.current.forEach((el) => resizeMasonryItem(el));
  }, [resizeMasonryItem]);

  useEffect(() => {
    // re-measure when gallery changes
    resizeAll();

    const ro = new ResizeObserver((entries) => {
      entries.forEach((entry) => resizeMasonryItem(entry.target));
    });

    itemRefs.current.forEach((el) => el && ro.observe(el));

    window.addEventListener('resize', resizeAll);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resizeAll);
    };
  }, [selectedGallery, images.length, resizeAll, resizeMasonryItem]);

  return (
    <div className="min-h-screen rsvp-gold-background no-save" onContextMenu={block} onDragStart={block}>
      {/* Gallery chooser */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-10">
        <div className="text-center">
          <h1 className="mt-12 text-green font-altitude text-4xl sm:text-5xl md:text-6xl leading-tight">
            Choose a Gallery
          </h1>

          <div className="mt-4 flex justify-center">
            <Image
              src="/images/swans.svg"
              alt="Swans"
              width={120}
              height={48}
              className="h-12 w-auto opacity-90 pointer-events-none"
              draggable={false}
            />
          </div>

          <p className="mt-5 max-w-[62ch] mx-auto text-sm sm:text-base leading-7">
            Select a gallery below to view photos from that shoot.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {GALLERY_KEYS.map((name) => {
            const isActive = name === selectedGallery;
            const cover = coverFor(name);

            return (
              <button
                key={name}
                type="button"
                onClick={() => chooseGallery(name)}
                onContextMenu={block}
                onDragStart={block}
                className={[
                  'group relative overflow-hidden border rounded-none transition text-left',
                  isActive
                    ? 'border-green/60 bg-white/70'
                    : 'border-black/10 bg-white/55 hover:bg-white/70 hover:border-black/20',
                ].join(' ')}
              >
                <div className="relative h-32 sm:h-40 w-full bg-black/10">
                  {cover ? (
                    <>
                      <Image
                        src={cover}
                        alt={`${name} cover`}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03] pointer-events-none"
                        quality={82}
                        draggable={false}
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/0" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm">Add cover photo</div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase">Gallery</p>
                  <h2 className="mt-2 text-2xl sm:text-3xl text-green font-altitude leading-tight">{name}</h2>

                  <div className="mt-5">
                    <span
                      className={[
                        'inline-block px-4 py-2 text-[11px] sm:text-xs tracking-[0.22em] uppercase rounded-none border transition',
                        isActive
                          ? 'bg-green text-champagne border-green'
                          : 'bg-transparent border-green/30 text-green/90 group-hover:border-green/30 hover:font-bold transition',
                      ].join(' ')}
                    >
                      {isActive ? 'Selected' : 'View'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Photos */}
      <section ref={gridRef} className="max-w-6xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
        <div className="mb-6 sm:mb-8 text-center">
          <p className="tracking-[0.22em] text-[10px] sm:text-xs uppercase">Now viewing</p>
          <h2 className="mt-2 text-3xl sm:text-4xl text-green font-altitude">{selectedGallery}</h2>

          {isBridalShower && BRIDAL_SHOWER_MORE_PHOTOS_URL && (
            <div className="mt-5 flex items-center justify-center">
              <a
                href={BRIDAL_SHOWER_MORE_PHOTOS_URL}
                target="_blank"
                rel="noreferrer"
                onContextMenu={block}
                className="px-5 py-2 text-[11px] sm:text-xs tracking-[0.22em] uppercase
                           border border-green/30 text-green hover:border-green/60 transition
                           hover:font-bold rounded-none text-center bg-white/60"
              >
                See more photos here
              </a>
            </div>
          )}
        </div>

        {/* ✅ TRUE masonry grid (no big holes) */}
        <div
          ref={masonryGridRef}
          className={[
            'grid',
            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
            'gap-3 sm:gap-4 lg:gap-5',
            '[grid-auto-flow:dense]',
            `[grid-auto-rows:${MASONRY_ROW_PX}px]`,
          ].join(' ')}
        >
          {images.map((img, i) => {
            const eager = i < EAGER_THUMBS;

            return (
              <div
                key={`${img.src}-${img.num}`}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                style={{ gridRowEnd: 'span 1' }}
              >
                <div data-masonry-content="true">
                  <button
                    type="button"
                    onClick={() => openAt(i)}
                    onContextMenu={block}
                    onDragStart={block}
                    className="group relative w-full overflow-hidden border border-black/10 bg-white/40 rounded-none text-left"
                    aria-label={`Open photo ${img.num}`}
                  >
                    {/* reserved height so it never looks “missing” */}
                    <div className={`relative w-full ${aspectClass(img.tile)} bg-black/10 overflow-hidden`}>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={[
                          'pointer-events-none',
                          'transition-transform duration-500 group-hover:scale-[1.02]',
                          objectPosClass(img.tile),
                          'object-cover',
                        ].join(' ')}
                        quality={82}
                        loading={eager ? 'eager' : 'lazy'}
                        // keep priority small to avoid Next warnings
                        priority={i < 6}
                        draggable={false}
                        onLoadingComplete={() => {
                          // re-measure when each image finishes loading
                          resizeAll();
                        }}
                        onError={() => resizeAll()}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lightbox */}
      {open && images[index] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 no-save"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onContextMenu={block}
          onDragStart={block}
        >
          <div className="relative w-full max-w-5xl bg-black/30 border border-white/20 rounded-none overflow-hidden">
            <div className="relative w-full aspect-[16/10] bg-black">
              <Image
                src={images[index].src}
                alt={images[index].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-contain pointer-events-none"
                quality={92}
                priority
                draggable={false}
              />
              <div className="absolute inset-0" onContextMenu={block} onDragStart={block} />
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              onContextMenu={block}
              className="absolute top-3 right-3 px-4 py-2 text-[11px] sm:text-xs tracking-[0.22em] uppercase
                         border border-white/35 text-white/90 hover:border-white/60 transition hover:font-bold rounded-none
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Close
            </button>

            <button
              type="button"
              onClick={prev}
              onContextMenu={block}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12
                         border border-white/30 text-white/90 hover:border-white/60 transition rounded-none
                         flex items-center justify-center"
              aria-label="Previous photo"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={next}
              onContextMenu={block}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12
                         border border-white/30 text-white/90 hover:border-white/60 transition rounded-none
                         flex items-center justify-center"
              aria-label="Next photo"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
