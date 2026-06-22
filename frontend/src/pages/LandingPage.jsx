import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Diamond, ShieldCheck, Zap, ArrowRight, Award, Flame, Gem, Crown, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ───────────────────── Floating Particles Canvas ───────────────────── */
const ParticleField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -(Math.random() * 0.3 + 0.1);
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.gold = Math.random() > 0.3;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.opacity += Math.sin(Date.now() * 0.001 + this.x) * 0.003;
        if (this.y < -10) { this.y = canvas.height + 10; this.x = Math.random() * canvas.width; }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.gold
          ? `rgba(212,175,55,${Math.max(0, this.opacity)})`
          : `rgba(200,160,40,${Math.max(0, this.opacity * 0.4)})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 60; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

/* ───────────────────── Magnetic Button ───────────────────── */
const MagneticButton = ({ children, onClick, className }) => {
  const btnRef = useRef(null);

  const handleMove = useCallback((e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
  }, []);

  const handleLeave = useCallback(() => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </button>
  );
};

/* ───────────────────── Animated Counter ───────────────────── */
const AnimCounter = ({ end, suffix = '', label }) => {
  const ref = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
        gsap.to({ val: 0 }, {
          val: end, duration: 2, ease: 'power2.out',
          onUpdate: function() {
            if (numRef.current) numRef.current.textContent = Math.round(this.targets()[0].val) + suffix;
          }
        });
      }
    });
  }, [end, suffix]);

  return (
    <div ref={ref} className="text-center" style={{ opacity: 0 }}>
      <div ref={numRef} className="font-serif text-3xl md:text-5xl font-bold text-gold-gradient">0{suffix}</div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-2 font-mono">{label}</p>
    </div>
  );
};

/* ───────────────────── Main Landing Page ───────────────────── */
const LandingPage = ({ onNavigate }) => {
  const heroRef = useRef(null);
  const navRef = useRef(null);
  const badgeRef = useRef(null);
  const titleLine1Ref = useRef(null);
  const titleLine2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const sectionFeaturesRef = useRef(null);
  const cardRefs = useRef([]);
  const testimonialRef = useRef(null);
  const footerRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── Navbar entrance ── */
      gsap.fromTo(navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.1, ease: 'power3.out' }
      );

      /* ── Badge pop ── */
      gsap.fromTo(badgeRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, delay: 0.6, ease: 'back.out(2)' }
      );

      /* ── Title lines ── */
      gsap.fromTo(titleLine1Ref.current,
        { y: 80, opacity: 0, skewY: 4 },
        { y: 0, opacity: 1, skewY: 0, duration: 1.2, delay: 0.4, ease: 'power4.out' }
      );
      gsap.fromTo(titleLine2Ref.current,
        { y: 80, opacity: 0, skewY: 4 },
        { y: 0, opacity: 1, skewY: 0, duration: 1.2, delay: 0.6, ease: 'power4.out' }
      );

      /* ── Subtitle ── */
      gsap.fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 1, ease: 'power3.out' }
      );

      /* ── CTA buttons ── */
      gsap.fromTo(ctaRef.current?.children || [],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 1.2, stagger: 0.15, ease: 'power3.out' }
      );

      /* ── Decorative diamond float ── */
      gsap.to('.hero-diamond-float', {
        y: -15, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });

      /* ── Feature section heading ── */
      const featTitle = sectionFeaturesRef.current?.querySelector('.section-title');
      if (featTitle) {
        gsap.fromTo(featTitle,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: featTitle, start: 'top 85%', once: true }
          }
        );
      }

      /* ── Feature cards stagger ── */
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { y: 60, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true }
          }
        );
      });

      /* ── Testimonial ── */
      if (testimonialRef.current) {
        gsap.fromTo(testimonialRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: testimonialRef.current, start: 'top 85%', once: true }
          }
        );
      }

      /* ── Footer ── */
      if (footerRef.current) {
        gsap.fromTo(footerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1, ease: 'power2.out',
            scrollTrigger: { trigger: footerRef.current, start: 'top 95%', once: true }
          }
        );
      }

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: Zap, title: 'Ultra-Fast Checkout', desc: 'Generate GST-compliant invoices in under 10 seconds. Integrated weight, making charges, and wastage calculations ensure 100% precision.', accent: 'from-amber-500/20 to-yellow-600/10' },
    { icon: ShieldCheck, title: 'GST Compliant (India)', desc: 'Pre-configured for 3% GST (1.5% CGST + 1.5% SGST) for precious metal and diamond jewelry items. Supports automated HSN tracking.', accent: 'from-emerald-500/20 to-green-600/10' },
    { icon: Flame, title: 'Showroom Analytics', desc: 'Track daily collections, metal category margins, customer sales logs, and low-inventory warnings on an elegant dark dashboard.', accent: 'from-rose-500/20 to-red-600/10' },
  ];

  return (
    <div ref={heroRef} className="min-h-screen flex flex-col bg-transparent relative overflow-x-hidden">
      <ParticleField />

      {/* ═══════════ Luxury Navbar ═══════════ */}
      <header
        ref={navRef}
        className={`w-full py-5 px-6 md:px-16 flex justify-between items-center border-b sticky top-0 z-50 transition-all duration-500 ${
          navScrolled
            ? 'border-gold/15 bg-black/80 backdrop-blur-xl shadow-lg shadow-gold/5'
            : 'border-gold/10 glass-panel'
        }`}
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 border border-gold/50 rounded-full flex items-center justify-center shadow-goldGlow group-hover:shadow-goldGlowStrong transition-all duration-500 group-hover:rotate-[360deg]"
            style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.5s' }}
          >
            <Diamond className="w-5 h-5 text-gold" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-widest text-gold-gradient">KAIYA</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-zinc-400">
          {['Features', 'Showroom Values', 'Security'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
              className="hover:text-gold transition-colors duration-300 relative group/link"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover/link:w-full" />
            </a>
          ))}
        </nav>

        <MagneticButton
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 border border-gold/30 rounded-full text-xs uppercase tracking-widest font-semibold hover:border-gold hover:text-gold shadow-goldGlow hover:shadow-goldGlowStrong transition-all duration-300 relative overflow-hidden group/btn"
        >
          <span className="relative z-10">Access Portal</span>
          <span className="absolute inset-0 bg-gold/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
        </MagneticButton>
      </header>

      {/* ═══════════ Hero Section ═══════════ */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-24 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center relative">

          {/* Decorative floating elements */}
          <div className="absolute -top-10 -left-20 hero-diamond-float opacity-20 hidden lg:block">
            <Gem className="w-8 h-8 text-gold" />
          </div>
          <div className="absolute top-20 -right-16 hero-diamond-float opacity-15 hidden lg:block" style={{ animationDelay: '1s' }}>
            <Crown className="w-6 h-6 text-gold" />
          </div>
          <div className="absolute bottom-32 -left-12 hero-diamond-float opacity-10 hidden lg:block" style={{ animationDelay: '2s' }}>
            <Star className="w-5 h-5 text-gold" />
          </div>

          {/* Badge */}
          <div ref={badgeRef}
            className="mb-6 flex items-center gap-2 px-5 py-2 rounded-full border border-gold/20 bg-zinc-950/60 shadow-goldGlow"
            style={{ opacity: 0 }}
          >
            <Award className="w-4 h-4 text-gold" />
            <span className="text-[10px] md:text-xs uppercase tracking-widest font-semibold text-gold">
              Showroom Edition v1.0
            </span>
          </div>

          {/* Title - split into two animated lines */}
          <div className="overflow-hidden mb-2">
            <h1 ref={titleLine1Ref}
              className="font-serif text-4xl md:text-7xl lg:text-8xl font-bold tracking-wider leading-none text-white uppercase"
              style={{ opacity: 0 }}
            >
              Timeless Elegance.
            </h1>
          </div>
          <div className="overflow-hidden mb-8">
            <h1 ref={titleLine2Ref}
              className="font-serif text-4xl md:text-7xl lg:text-8xl font-bold tracking-wider leading-none text-gold-gradient uppercase"
              style={{ opacity: 0 }}
            >
              Precision Billing.
            </h1>
          </div>

          {/* Subtitle */}
          <p ref={subtitleRef}
            className="text-zinc-400 md:text-lg lg:text-xl max-w-2xl mb-12 font-sans font-light tracking-wide leading-relaxed"
            style={{ opacity: 0 }}
          >
            A high-end, GST-compliant invoicing and inventory control platform designed specifically for luxury gold, silver, and diamond jewelry showrooms.
          </p>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 mb-28">
            <MagneticButton
              onClick={() => onNavigate('login')}
              className="group px-10 py-4 bg-gold-gradient text-black rounded-lg text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 hover:shadow-goldGlowStrong transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Billing Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </MagneticButton>
            <MagneticButton
              onClick={() => onNavigate('login')}
              className="px-10 py-4 bg-zinc-950/60 border border-gold/20 hover:border-gold/40 text-white rounded-lg text-xs uppercase tracking-widest font-bold hover:shadow-goldGlow transition-all duration-300"
            >
              Manager Dashboard
            </MagneticButton>
          </div>
        </div>

        {/* ═══════════ Stats Counter Row ═══════════ */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 px-4">
          <AnimCounter end={500} suffix="+" label="Active Showrooms" />
          <AnimCounter end={10} suffix="s" label="Invoice Speed" />
          <AnimCounter end={99} suffix="%" label="GST Accuracy" />
          <AnimCounter end={24} suffix="/7" label="Cloud Uptime" />
        </div>

        {/* ═══════════ Features Section ═══════════ */}
        <div id="features" ref={sectionFeaturesRef} className="w-full max-w-6xl mx-auto px-4">
          <h2 className="section-title font-serif text-2xl md:text-4xl lg:text-5xl text-white tracking-widest uppercase mb-16">
            Engineered for <span className="text-gold-gradient">Showroom Excellence</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  ref={el => cardRefs.current[i] = el}
                  className="group relative p-8 rounded-2xl border border-gold/10 bg-zinc-900/40 backdrop-blur-md hover:border-gold/30 transition-all duration-500 cursor-default overflow-hidden"
                  style={{ opacity: 0 }}
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl`} />

                  {/* Top light sweep on hover */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-luxuryRed/20 border border-luxuryRed/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-redGlow">
                      <Icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white mb-3 uppercase tracking-wider group-hover:text-gold-light transition-colors duration-300">
                      {feat.title}
                    </h3>
                    <p className="text-zinc-400 text-sm font-light leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════ Testimonial ═══════════ */}
        <div id="showroom-values" ref={testimonialRef}
          className="w-full max-w-4xl mx-auto px-4 mt-32 py-16 border-t border-gold/10 relative"
          style={{ opacity: 0 }}
        >
          {/* Quotation mark */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-gold/20 font-serif text-8xl leading-none select-none">"</div>

          <p className="font-serif italic text-lg md:text-2xl text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Kaiya Jewel Billing has completely transformed our showroom checkout speed. Our customer base loves the clean print receipts and the rapid calculation of purity and making charges.
          </p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-gold fill-gold" />
              ))}
            </div>
            <h4 className="font-serif text-gold font-semibold tracking-wider text-sm">VARDHAMAN JEWELLERS</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Premium Gold Retailer, Mumbai</p>
          </div>
        </div>
      </main>

      {/* ═══════════ Footer ═══════════ */}
      <footer ref={footerRef} className="w-full py-10 border-t border-gold/10 text-center relative z-10" style={{ opacity: 0 }}>
        <p className="text-xs text-zinc-600 tracking-wider">&copy; {new Date().getFullYear()} KAIYA LUXURY SYSTEMS. ALL RIGHTS RESERVED.</p>
        <p className="text-[10px] text-zinc-700 mt-2 font-mono uppercase">Designed for High-End Jewelry Showrooms</p>
      </footer>
    </div>
  );
};

export default LandingPage;
