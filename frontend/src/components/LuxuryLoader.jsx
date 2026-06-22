import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const LuxuryLoader = () => {
  const containerRef = useRef(null);
  const diamondRef = useRef(null);
  const ringsRef = useRef([]);
  const progressRef = useRef(null);
  const progressFillRef = useRef(null);
  const textRef = useRef(null);
  const subtextRef = useRef(null);
  const particlesRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Create floating particles
      if (particlesRef.current) {
        for (let i = 0; i < 30; i++) {
          const particle = document.createElement('div');
          const size = Math.random() * 4 + 1;
          particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(212,175,55,${Math.random() * 0.6 + 0.2}), transparent);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            pointer-events: none;
          `;
          particlesRef.current.appendChild(particle);

          gsap.to(particle, {
            y: `random(-80, 80)`,
            x: `random(-40, 40)`,
            opacity: `random(0.1, 0.8)`,
            duration: `random(2, 5)`,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 2,
          });
        }
      }

      // Diamond entrance - scale up from nothing with rotation
      tl.fromTo(diamondRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.7)' }
      );

      // Pulsing rings expand outward
      ringsRef.current.forEach((ring, i) => {
        tl.fromTo(ring,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' },
          `-=${0.6 - i * 0.1}`
        );
      });

      // Diamond continuous pulse
      gsap.to(diamondRef.current, {
        scale: 1.05,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.2,
      });

      // Ring rotation
      ringsRef.current.forEach((ring, i) => {
        gsap.to(ring, {
          rotation: i % 2 === 0 ? 360 : -360,
          duration: 8 + i * 4,
          repeat: -1,
          ease: 'none',
        });
      });

      // Brand text reveal
      tl.fromTo(textRef.current,
        { y: 20, opacity: 0, letterSpacing: '0.5em' },
        { y: 0, opacity: 1, letterSpacing: '0.3em', duration: 1, ease: 'power3.out' },
        '-=0.3'
      );

      // Subtext
      tl.fromTo(subtextRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.5'
      );

      // Progress bar
      tl.fromTo(progressRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );

      // Animate progress fill
      gsap.to({}, {
        duration: 2.5,
        delay: 1.5,
        onUpdate: function() {
          const p = Math.round(this.progress() * 100);
          setProgress(p);
        },
        ease: 'power2.inOut',
      });

      if (progressFillRef.current) {
        gsap.fromTo(progressFillRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 2.5, delay: 1.5, ease: 'power2.inOut', transformOrigin: 'left center' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a0808 0%, #0a0303 40%, #000000 100%)' }}
    >
      {/* Particle field */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, rgba(122,12,12,0.03) 50%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Diamond Logo with Rings */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-10">
        {/* Outer ring */}
        <div
          ref={el => ringsRef.current[2] = el}
          className="absolute w-36 h-36 rounded-full"
          style={{
            border: '1px solid rgba(212,175,55,0.08)',
            boxShadow: '0 0 30px rgba(212,175,55,0.03)',
          }}
        />
        {/* Middle ring */}
        <div
          ref={el => ringsRef.current[1] = el}
          className="absolute w-28 h-28 rounded-full"
          style={{
            border: '1px solid rgba(212,175,55,0.15)',
            boxShadow: '0 0 20px rgba(212,175,55,0.05)',
          }}
        />
        {/* Inner ring */}
        <div
          ref={el => ringsRef.current[0] = el}
          className="absolute w-20 h-20 rounded-full"
          style={{
            border: '1.5px solid rgba(212,175,55,0.3)',
            boxShadow: '0 0 15px rgba(212,175,55,0.1), inset 0 0 15px rgba(212,175,55,0.05)',
          }}
        />

        {/* Diamond SVG */}
        <div ref={diamondRef} className="relative z-10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F3E5AB" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA7C11" />
              </linearGradient>
            </defs>
            <path d="M6 3h12l4 6-10 13L2 9z" />
            <path d="M11 3l1 10M2 9h20M7.5 3l-2 6 6.5 13M16.5 3l2 6-6.5 13" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      <h1 ref={textRef} className="font-serif text-4xl font-bold tracking-widest text-gold-gradient uppercase mb-2"
        style={{ opacity: 0 }}
      >
        KAIYA
      </h1>
      <p ref={subtextRef} className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-mono mb-10"
        style={{ opacity: 0 }}
      >
        Luxury Showroom Systems
      </p>

      {/* Progress Bar */}
      <div className="w-48 flex flex-col items-center gap-3">
        <div ref={progressRef} className="w-full h-[1px] rounded-full overflow-hidden relative"
          style={{ background: 'rgba(212,175,55,0.1)', opacity: 0 }}
        >
          <div
            ref={progressFillRef}
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #AA7C11, #D4AF37, #F3E5AB)',
              transformOrigin: 'left center',
              transform: 'scaleX(0)',
            }}
          />
        </div>
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-mono tabular-nums">
          {progress}%
        </span>
      </div>
    </div>
  );
};

export default LuxuryLoader;
