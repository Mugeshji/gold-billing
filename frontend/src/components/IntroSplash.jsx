import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * IntroSplash — A cinematic entry animation that plays once on site load.
 * Features:
 *  - Animated diamond gemstone SVG drawn stroke-by-stroke
 *  - Golden particle burst on completion
 *  - Brand name letter-by-letter reveal with stagger
 *  - Tagline fade-in
 *  - Smooth scale-up & fade exit transition
 */
const IntroSplash = ({ onComplete }) => {
  const containerRef = useRef(null);
  const diamondSvgRef = useRef(null);
  const brandRef = useRef(null);
  const taglineRef = useRef(null);
  const progressTrackRef = useRef(null);
  const progressBarRef = useRef(null);
  const burstRef = useRef(null);
  const contentRef = useRef(null);
  const ambientRingsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const master = gsap.timeline({
        onComplete: () => {
          setTimeout(() => onComplete?.(), 100);
        },
      });

      /* ─── Ambient rotating rings ─── */
      ambientRingsRef.current.forEach((ring, i) => {
        if (!ring) return;
        gsap.fromTo(ring,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, delay: 0.2 + i * 0.2, ease: 'power2.out' }
        );
        gsap.to(ring, {
          rotation: i % 2 === 0 ? 360 : -360,
          duration: 12 + i * 6,
          repeat: -1,
          ease: 'none',
        });
      });

      /* ─── Phase 1: Diamond SVG stroke draw ─── */
      const paths = diamondSvgRef.current?.querySelectorAll('path');
      if (paths) {
        paths.forEach((path) => {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
        });

        master.to(paths, {
          strokeDashoffset: 0,
          duration: 1.8,
          stagger: 0.15,
          ease: 'power2.inOut',
        });
      }

      /* ─── Phase 1b: Glow pulse on the diamond ─── */
      master.to(diamondSvgRef.current, {
        filter: 'drop-shadow(0 0 25px rgba(212,175,55,0.7))',
        duration: 0.5,
        ease: 'power2.in',
      }, '-=0.4');

      /* ─── Phase 2: Particle burst ─── */
      master.add(() => {
        if (!burstRef.current) return;
        for (let i = 0; i < 50; i++) {
          const dot = document.createElement('div');
          const size = Math.random() * 5 + 2;
          const angle = (Math.PI * 2 * i) / 50 + (Math.random() - 0.5) * 0.3;
          const dist = Math.random() * 180 + 50;
          dot.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px;
            border-radius: 50%; left: 50%; top: 50%;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, ${Math.random() > 0.3 ? 'rgba(212,175,55,0.9)' : 'rgba(243,229,171,0.8)'}, transparent);
            pointer-events: none;
          `;
          burstRef.current.appendChild(dot);
          gsap.to(dot, {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            scale: 0,
            duration: 1 + Math.random() * 0.5,
            ease: 'power3.out',
          });
        }
      }, '-=0.2');

      /* ─── Phase 2b: Diamond scale punch ─── */
      master.to(diamondSvgRef.current, {
        scale: 1.2,
        duration: 0.25,
        ease: 'power4.out',
      }, '-=1');
      master.to(diamondSvgRef.current, {
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      }, '-=0.75');

      /* ─── Phase 3: Brand name letter stagger ─── */
      const letters = brandRef.current?.querySelectorAll('.splash-letter');
      if (letters?.length) {
        master.fromTo(letters,
          { y: 50, opacity: 0, rotateX: -90 },
          {
            y: 0, opacity: 1, rotateX: 0,
            duration: 0.5, stagger: 0.07,
            ease: 'back.out(1.7)',
          },
          '-=0.5'
        );
      }

      /* ─── Phase 4: Tagline fade ─── */
      master.fromTo(taglineRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        '-=0.15'
      );

      /* ─── Phase 5: Progress bar fill ─── */
      master.fromTo(progressTrackRef.current,
        { opacity: 0, scaleX: 0.5 },
        { opacity: 1, scaleX: 1, duration: 0.3 },
        '-=0.3'
      );
      master.fromTo(progressBarRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: 'power2.inOut', transformOrigin: 'left center' },
        '-=0.05'
      );

      /* ─── Phase 6: Brief hold ─── */
      master.to({}, { duration: 0.3 });

      /* ─── Phase 7: Exit — content zooms down and fades, and the container fades out smoothly ─── */
      master.to(contentRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.inOut',
      });

      master.to(containerRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
      }, '-=0.5');

    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  const brandLetters = 'KAIYA'.split('');

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 45%, #120505 0%, #080202 50%, #000000 100%)' }}
    >
      {/* ── Ambient background glow ── */}
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, rgba(122,12,12,0.03) 40%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Center content stack ── */}
      <div ref={contentRef} className="relative flex flex-col items-center z-[50]">

        {/* Ambient rotating rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: '200px', height: '200px' }}>
          <div ref={el => ambientRingsRef.current[0] = el}
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(212,175,55,0.25)', opacity: 0 }} />
          <div ref={el => ambientRingsRef.current[1] = el}
            className="absolute rounded-full"
            style={{ inset: '-25px', border: '1px solid rgba(212,175,55,0.12)', opacity: 0 }} />
          <div ref={el => ambientRingsRef.current[2] = el}
            className="absolute rounded-full"
            style={{ inset: '-50px', border: '1px solid rgba(212,175,55,0.06)', opacity: 0 }} />
        </div>

        {/* Particle burst container */}
        <div ref={burstRef} className="absolute inset-0 pointer-events-none" style={{ width: '400px', height: '400px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />

        {/* Diamond SVG — drawn stroke by stroke */}
        <div className="mb-8 relative">
          <svg
            ref={diamondSvgRef}
            width="90" height="90" viewBox="0 0 100 100"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 0px rgba(212,175,55,0))' }}
          >
            <defs>
              <linearGradient id="splashGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F3E5AB" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA7C11" />
              </linearGradient>
            </defs>
            {/* Outer gem shape */}
            <path d="M20 35 L50 10 L80 35 L50 90 Z" stroke="url(#splashGold)" strokeWidth="2" opacity="0" />
            {/* Inner facets */}
            <path d="M20 35 L50 50 L80 35" stroke="url(#splashGold)" strokeWidth="1.3" opacity="0" />
            <path d="M50 10 L50 50" stroke="url(#splashGold)" strokeWidth="1.3" opacity="0" />
            <path d="M50 50 L50 90" stroke="url(#splashGold)" strokeWidth="1.3" opacity="0" />
            {/* Extra facet lines */}
            <path d="M35 22 L50 50 L65 22" stroke="url(#splashGold)" strokeWidth="0.9" opacity="0" />
            <path d="M28 38 L50 50" stroke="url(#splashGold)" strokeWidth="0.7" opacity="0" />
            <path d="M72 38 L50 50" stroke="url(#splashGold)" strokeWidth="0.7" opacity="0" />
          </svg>
        </div>

        {/* Brand name — individual letters for stagger animation */}
        <div ref={brandRef} className="flex gap-1.5 mb-3" style={{ perspective: '600px' }}>
          {brandLetters.map((letter, i) => (
            <span
              key={i}
              className="splash-letter font-serif text-5xl md:text-7xl font-bold tracking-widest"
              style={{
                opacity: 0,
                display: 'inline-block',
                background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA7C11 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-zinc-500 font-mono mb-10"
          style={{ opacity: 0 }}
        >
          Luxury Showroom Systems
        </p>

        {/* Progress bar */}
        <div ref={progressTrackRef} className="w-44 h-[1.5px] rounded-full overflow-hidden relative" style={{ opacity: 0, background: 'rgba(212,175,55,0.12)' }}>
          <div
            ref={progressBarRef}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #AA7C11, #D4AF37, #F3E5AB)',
              transformOrigin: 'left center',
              transform: 'scaleX(0)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IntroSplash;
