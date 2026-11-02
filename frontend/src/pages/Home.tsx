import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight, Shield, Star, Leaf, Zap, Droplets, Sun, Dumbbell, Flame, Sparkles } from 'lucide-react';
import { Category, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { CardEffect } from '../components/category/CardEffect';
import backgroundImage from '../assets/background.png';
import backgroundImage1 from '../assets/background1.png';
import backgroundImage2 from '../assets/background2.png';
import backgroundImage3 from '../assets/background3.png';

// Four hero backdrops that cycle left → right, one after another.
const HERO_BACKGROUNDS = [backgroundImage, backgroundImage1, backgroundImage2, backgroundImage3];
// A duplicate of the first image is appended so the strip can keep sliding
// forward past the last slide onto this "clone" of slide 1, instead of
// snapping backward to loop.
const HERO_BACKGROUNDS_LOOP = [...HERO_BACKGROUNDS, HERO_BACKGROUNDS[0]];

// The hero photos are 1672×941. The hero stage uses this exact aspect ratio
// on EVERY screen size, so `background-size: cover` never has anything to
// crop — the full photo is always visible, on phone, tablet, laptop and PC.
const HERO_ASPECT = '1672 / 941';

interface HomeProps {
  onNavigate: (page: string) => void;
  categories: Category[];
  products: Product[];
  onOpenDetails: (product: Product) => void;
}

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'protein': return Dumbbell;
    case 'creatine': return Flame;
    case 'eaa-bcaa': return Droplets;
    case 'vitamins': return Sun;
    case 'pre-workout': return Zap;
    case 'wellbeing': return Leaf;
    default: return Sparkles;
  }
};

/* ---------- Hero copy pieces ----------
   Everything here is sized in `em`, so the whole block scales as one unit
   from whatever font-size its wrapper sets (a container-query unit over the
   photo on the overlay, a fixed size in the stacked block under the photo). */

const HeroBadge = () => (
  <div
    className="hero-badge-dot inline-flex items-center border border-emerald-400/50 bg-emerald-400/[0.08] text-emerald-300 font-bold uppercase backdrop-blur-sm rounded-full"
    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'max(8px, var(--hc-badge))', letterSpacing: '.3em', gap: '.9em', padding: '.6em 1.3em', marginBottom: '1.4em' }}
  >
    <span className="rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981] shrink-0" style={{ width: '.6em', height: '.6em' }} />
    Premium Supplements
  </div>
);

const HeroHeading = () => (
  <h1
    className="hero-heading-glow font-black uppercase text-white"
    style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '5em', lineHeight: 0.96, letterSpacing: '-.02em', margin: 0, padding: 0 }}
  >
    BUILD MUSCLE.
    <br />
    <span className="hero-heading-accent">FUEL GROWTH.</span>
  </h1>
);

// Short tagline — sits on the photo at every screen size (right under the
// heading). Floors at 11px so it stays readable on phones.
const HeroTagline = () => (
  <p
    className="text-zinc-200"
    style={{ fontFamily: "'DM Sans',sans-serif", maxWidth: '24em', fontSize: 'max(11px, 1em)', lineHeight: 1.4, margin: 0, padding: 0, marginTop: 'max(4px, .9em)' }}
  >
    Train Hard. Recover Smarter.
  </p>
);

// Buttons — on the photo on desktop, directly under it on phones/tablets.
const HeroBottom = () => (
  <>
    <div className="flex items-center" style={{ gap: 'max(6px, .9em)' }}>
      <button
        onClick={() => document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' })}
        className="hero-cta-primary group inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase transition-all duration-300 hover:-translate-y-1"
        style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 'max(8px, .72em)', letterSpacing: '.15em', padding: '1.1em 2.2em', whiteSpace: 'nowrap' }}
      >
        <span className="relative z-10 inline-flex items-center" style={{ gap: '.9em' }}>
          Shop Now <ArrowRight size="1.3em" className="transition-transform group-hover:translate-x-1.5" />
        </span>
      </button>
      <button
        onClick={() => document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' })}
        className="inline-flex items-center justify-center border border-white/40 text-white hover:border-emerald-400/80 hover:text-emerald-300 font-black uppercase transition-all duration-300 hover:-translate-y-1"
        style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 'max(8px, .72em)', letterSpacing: '.15em', padding: '1.1em 2.2em', whiteSpace: 'nowrap' }}
      >
        Learn More
      </button>
    </div>

  </>
);

export const Home: React.FC<HomeProps> = ({ onNavigate, categories, products, onOpenDetails }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [bgIndex, setBgIndex] = useState(0);
  const [bgTransitionOn, setBgTransitionOn] = useState(true);

  useEffect(() => {
    // Clamp at the clone slide so a throttled background tab can never push
    // the index past the end of the strip (that rendered as a black hero).
    const t = setInterval(() => {
      setBgIndex((i) => (i >= HERO_BACKGROUNDS.length ? i : i + 1));
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const handleBgTransitionEnd = () => {
    if (bgIndex === HERO_BACKGROUNDS.length) {
      setBgTransitionOn(false);
      setBgIndex(0);
    }
  };

  useEffect(() => {
    if (!bgTransitionOn) {
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setBgTransitionOn(true)));
      return () => cancelAnimationFrame(raf);
    }
  }, [bgTransitionOn]);

  return (
    <div className="w-full overflow-x-hidden">
      {/* HERO SECTION
          One layout for every device:
          - The photo "stage" always has the photo's own aspect ratio, so the
            whole picture shows (no cropping) on phone, tablet, laptop, PC.
          - Everything inside the stage (heading, smoke, badge) is sized in
            container-query units (cqw), so it scales with the photo and the
            composition looks identical at any width.
          - Desktop (≥1024px): the whole copy block (badge, heading,
            paragraph, buttons, stats) sits over the photo like the design.
          - Below 1024px: badge + heading stay on the photo exactly as on
            desktop; paragraph, buttons and stats continue directly under it
            on the same dark color, so they stay readable instead of
            shrinking to a few pixels. */}
      <section className="celticore-photo-hero relative w-full" style={{ background: '#030a08' }}>
        <style>{`
          .hero-stage {
            position:relative; width:100%; overflow:hidden;
            aspect-ratio:${HERO_ASPECT};
            container-type:inline-size;
            background:#030a08;
          }

          /* Sliding photo strip */
          .hero-photo-track {
            position:absolute; inset:0; display:flex;
            width:${HERO_BACKGROUNDS_LOOP.length * 100}%;
          }
          .hero-photo-slide {
            position:relative; flex-shrink:0; overflow:hidden;
            width:${100 / HERO_BACKGROUNDS_LOOP.length}%; height:100%;
          }
          /* Stage has the photo's own ratio, so cover == the full photo. */
          .hero-photo-slide-img {
            position:absolute; inset:0;
            background-size:cover; background-position:center;
            background-repeat:no-repeat;
            animation: kenBurns 22s ease-in-out infinite alternate;
          }
          @keyframes kenBurns {
            0%   { transform:scale(1); }
            100% { transform:scale(1.035); }
          }

          .hero-photo-scrim {
            position:absolute; inset:0; pointer-events:none;
            background:
              linear-gradient(90deg, rgba(3,10,8,.88) 0%, rgba(3,10,8,.7) 24%, rgba(3,10,8,.3) 48%, rgba(3,10,8,.1) 66%, rgba(3,10,8,.04) 100%),
              linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 26%),
              linear-gradient(to bottom, rgba(0,0,0,.3) 0%, transparent 16%);
          }
          /* Phones/tablets: fade the bottom of the photo into the solid dark
             fill of the text block underneath so there is no visible seam. */
          .hero-bottom-fade {
            position:absolute; left:0; right:0; bottom:-1px; height:22%; pointer-events:none;
            background: linear-gradient(to top, #030a08 0%, rgba(3,10,8,.7) 40%, transparent 100%);
          }

          .hero-light-sweep {
            position:absolute; inset:0; pointer-events:none; mix-blend-mode:overlay;
            background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.12) 48%, rgba(255,255,255,.22) 50%, rgba(255,255,255,.12) 52%, transparent 60%);
            background-size: 300% 300%;
            animation: lightSweep 9s ease-in-out infinite;
          }
          @keyframes lightSweep {
            0%, 100% { background-position: 120% 0%; }
            50% { background-position: -20% 100%; }
          }

          /* Smoke — sized in cqw so it scales with the photo on every device */
          .hero-smoke-col { position:absolute; bottom:4%; pointer-events:none; }
          .hero-smoke-wisp {
            position:absolute; bottom:0; left:50%;
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            filter: blur(.85cqw);
            mix-blend-mode: screen;
            animation-name: smokeRise;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
          @keyframes smokeRise {
            0%   { transform: translate(-50%, 0) translateX(0) scaleY(0.6) scaleX(1); opacity: 0; }
            12%  { opacity: .55; }
            35%  { transform: translate(-50%, -38%) translateX(14px) scaleY(1.05) scaleX(0.92); opacity: .62; }
            60%  { transform: translate(-50%, -64%) translateX(-12px) scaleY(1.4) scaleX(0.78); opacity: .4; }
            82%  { transform: translate(-50%, -88%) translateX(10px) scaleY(1.75) scaleX(0.6); opacity: .16; }
            100% { transform: translate(-50%, -112%) translateX(-6px) scaleY(2) scaleX(0.45); opacity: 0; }
          }
          .hero-smoke-emerald { background: linear-gradient(to top, rgba(16,185,129,.6), rgba(110,255,205,.3) 45%, transparent 90%); }
          .hero-smoke-amber   { background: linear-gradient(to top, rgba(245,158,11,.5), rgba(253,230,138,.25) 45%, transparent 90%); }
          .hero-smoke-red     { background: linear-gradient(to top, rgba(239,68,68,.42), rgba(252,165,165,.2) 45%, transparent 90%); }

          .hero-smoke-glow { position:absolute; bottom:-6%; left:50%; translate:-50% 0; border-radius:50%; filter:blur(1.15cqw); animation:smokeGlowPulse 3.4s ease-in-out infinite; pointer-events:none; }
          @keyframes smokeGlowPulse { 0%,100% { opacity:.35; transform:translate(-50%,0) scale(1); } 50% { opacity:.65; transform:translate(-50%,0) scale(1.18); } }

          /* Overlay copy: base font-size is the paragraph size; everything
             else is in em, so it all scales together with the photo. */
          .hero-overlay {
            position:absolute; inset:0; z-index:10;
            display:flex; align-items:center;
            padding-left:6cqw; padding-right:4cqw;
          }
          .hero-copy {
            --hc-badge: .8em;
            font-size: 1.55cqw;          /* heading = 5em ≈ 7.75cqw on phones */
            width:100%;
          }
          /* Buttons sit right under the tagline on every screen size.
             On small screens they shrink (with a readable floor) so they
             fit on the photo. */
          .hero-cta-wrap { margin-top: max(8px, 1.6em); }
          @media (min-width: 1024px) {
            .hero-cta-wrap { margin-top: 2.2em; }
            .hero-overlay { padding-left:13cqw; padding-right:4cqw; }
            .hero-copy {
              --hc-badge: .65em;
              font-size: clamp(11px, 1.05cqw, 26px);  /* heading ≈ 5.25cqw */
              max-width: 34em;
            }
          }

          .hero-enter { animation:heroEnter .8s cubic-bezier(.2,.75,.25,1) both; }
          @keyframes heroEnter { from {opacity:0; transform:translateY(22px)} to {opacity:1; transform:translateY(0)} }

          .hero-heading-glow { text-shadow: 0 3px 24px rgba(0,0,0,.65); }
          .hero-heading-accent {
            background: linear-gradient(90deg,
              #10b981 0%, #10b981 16.66%,
              #06b6d4 16.66%, #06b6d4 33.32%,
              #3b82f6 33.32%, #3b82f6 49.98%,
              #a855f7 49.98%, #a855f7 66.64%,
              #f59e0b 66.64%, #f59e0b 83.3%,
              #ef4444 83.3%, #ef4444 100%,
              #10b981 100%);
            background-size: 600% 100%;
            -webkit-background-clip: text; background-clip: text; color: transparent;
            animation: accentSheen 6s linear infinite;
            filter: drop-shadow(0 2px 18px rgba(16,185,129,.4));
          }
          @keyframes accentSheen { from { background-position: 0% 0; } to { background-position: -600% 0; } }

          .hero-cta-primary { position:relative; overflow:hidden; animation: ctaGlowPulse 2.6s ease-in-out infinite; }
          .hero-cta-primary::before {
            content:""; position:absolute; inset:0; background:linear-gradient(120deg, transparent 20%, rgba(255,255,255,.55) 50%, transparent 80%);
            transform:translateX(-120%); transition:transform .65s ease;
          }
          .hero-cta-primary:hover::before { transform:translateX(120%); }
          @keyframes ctaGlowPulse {
            0%,100% { box-shadow: 0 0 0 rgba(16,185,129,0); }
            50% { box-shadow: 0 10px 34px rgba(16,185,129,.45); }
          }

          .hero-badge-dot span { position:relative; }
          .hero-badge-dot span::after {
            content:""; position:absolute; inset:-5px; border-radius:50%; border:1px solid rgba(16,185,129,.55);
            animation: badgePing 2.2s cubic-bezier(0,.7,.4,1) infinite;
          }
          @keyframes badgePing { 0% { transform:scale(.6); opacity:.9 } 80%,100% { transform:scale(2.1); opacity:0 } }

          .hero-stat { transition: transform .3s ease; animation: statFloat 4s ease-in-out infinite; }
          .hero-stat:nth-child(1) { animation-delay: 0s; }
          .hero-stat:nth-child(3) { animation-delay: .6s; }
          .hero-stat:nth-child(5) { animation-delay: 1.2s; }
          @keyframes statFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
          .hero-stat:hover { transform:translateY(-6px); animation-play-state:paused; }
          .hero-stat:hover .hero-stat-val { color:#6ee7b7; text-shadow:0 0 18px rgba(16,185,129,.6); }
          .hero-stat-val { transition: color .25s ease, text-shadow .25s ease; }
          .hero-stat-icon { transition: transform .3s ease, box-shadow .3s ease; }
          .hero-stat:hover .hero-stat-icon { transform: scale(1.08); box-shadow: 0 0 18px rgba(16,185,129,.45); }

          @media (prefers-reduced-motion:reduce) {
            .celticore-photo-hero *, .celticore-photo-hero *::before, .celticore-photo-hero *::after { animation:none !important; transition:none !important; }
          }
        `}</style>

        {/* ---- PHOTO STAGE (always the photo's own aspect ratio) ---- */}
        <div className="hero-stage">
          <div
            className="hero-photo-track"
            onTransitionEnd={handleBgTransitionEnd}
            style={{
              transform: `translateX(-${bgIndex * (100 / HERO_BACKGROUNDS_LOOP.length)}%)`,
              transition: bgTransitionOn ? 'transform 1.6s cubic-bezier(.45,0,.2,1)' : 'none',
            }}
          >
            {HERO_BACKGROUNDS_LOOP.map((bg, i) => (
              <div key={i} className="hero-photo-slide">
                <div className="hero-photo-slide-img" style={{ backgroundImage: `url(${bg})` }} />
              </div>
            ))}
          </div>

          {/* Slide position dots */}
          <div className="absolute z-20 flex items-center gap-1.5 sm:gap-2" style={{ top: '2.2cqw', right: '3cqw' }}>
            {HERO_BACKGROUNDS.map((_, i) => {
              const active = i === (bgIndex % HERO_BACKGROUNDS.length);
              return (
                <button
                  key={i}
                  onClick={() => { setBgTransitionOn(true); setBgIndex(i); }}
                  aria-label={`Show background ${i + 1}`}
                  className="transition-all duration-300 cursor-pointer rounded-full"
                  style={{
                    width: active ? 18 : 6,
                    height: 6,
                    background: active ? '#10B981' : 'rgba(255,255,255,0.35)',
                    boxShadow: active ? '0 0 10px rgba(16,185,129,.8)' : 'none',
                  }}
                />
              );
            })}
          </div>

          <div className="hero-photo-scrim" />
          <div className="hero-light-sweep" />

          {/* Animated colored smoke rising behind the bottles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
            {[
              { left: '66%', color: 'hero-smoke-emerald', glow: 'rgba(16,185,129,.5)', width: 70, height: 230, dur: 6.2 },
              { left: '72%', color: 'hero-smoke-emerald', glow: 'rgba(16,185,129,.55)', width: 110, height: 300, dur: 7.6 },
              { left: '79%', color: 'hero-smoke-amber', glow: 'rgba(245,158,11,.45)', width: 90, height: 270, dur: 7 },
              { left: '85%', color: 'hero-smoke-red', glow: 'rgba(239,68,68,.4)', width: 65, height: 210, dur: 6.6 },
            ].map((col, ci) => {
              const cq = (px: number) => `${((px / 1900) * 100).toFixed(2)}cqw`;
              return (
                <div key={`smokecol-${ci}`} className="hero-smoke-col" style={{ left: col.left }}>
                  <div className="hero-smoke-glow" style={{ width: cq(col.width * 1.6), height: cq(col.width * 1.6), background: col.glow }} />
                  {[0, 1, 2, 3].map((wi) => (
                    <div
                      key={wi}
                      className={`hero-smoke-wisp ${col.color}`}
                      style={{
                        width: cq(col.width),
                        height: cq(col.height),
                        animationDuration: `${col.dur}s`,
                        animationDelay: `${wi * (col.dur / 4)}s`,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Copy over the photo: badge + heading everywhere; the rest too on desktop */}
          <div className="hero-overlay">
            <div className="hero-copy hero-enter">
              <HeroBadge />
              <HeroHeading />
              <HeroTagline />
              <div className="hero-cta-wrap">
                <HeroBottom />
              </div>
            </div>
          </div>

          <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        </div>

      </section>

      {/* CATEGORY EXPLORATION */}
      <section className="relative py-6 pb-14 sm:pb-20 md:pb-28 px-4 sm:px-6 md:px-14 lg:px-20" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(16,185,129,0.5))" }}/>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.35em] sm:tracking-[0.45em] uppercase text-emerald-500 whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>Our Range</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(16,185,129,0.5))" }}/>
          </div>
          <h2 className="text-center font-black tracking-tight text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2rem, 8vw, 4.5rem)", lineHeight: 0.95 }}>
            EXPLORE THE <span className="text-gold">CATEGORIES</span>
          </h2>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-3 px-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Precision-formulated. Clinically dosed. Zero compromise.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.id);
            const accent = cat.accentColor || cat.accent_color || "#10B981";
            const cardEffect = cat.effect || "energy";
            const isHovered = hoveredCard === cat.id;
            return (
              <div
                key={cat.id}
                className="group relative overflow-hidden cursor-pointer category-card rounded-2xl aspect-[4/3] xs:aspect-[16/11] sm:aspect-[16/10]"
                style={{
                  background: accent,
                  transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: isHovered ? "0 18px 34px rgba(0,0,0,0.22)" : "0 4px 14px rgba(0,0,0,0.06)",
                  transition: "transform 300ms ease, box-shadow 300ms ease",
                }}
                onMouseEnter={() => setHoveredCard(cat.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onNavigate(cat.id)}
              >
                <span
                  className="absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full pointer-events-none"
                  style={{ border: "1.5px solid rgba(255,255,255,0.28)" }}
                />

                <CardEffect effect={cardEffect} color={accent} />

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)" }}
                />

                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-400 pointer-events-none">
                  <Icon size={72} className="sm:hidden" color="#ffffff" />
                  <Icon size={110} className="hidden sm:block" color="#ffffff" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform duration-300"
                      style={{ background: "rgba(255,255,255,0.2)", transform: isHovered ? "scale(1.08)" : "scale(1)" }}
                    >
                      <Icon size={16} className="sm:hidden" color="#ffffff" />
                      <Icon size={18} className="hidden sm:block" color="#ffffff" />
                    </div>
                    <div
                      className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1"
                      style={{ color: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      View All <ChevronRight size={10}/>
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-1"
                      style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {cat.tagline}
                    </p>
                    <h3
                      className="text-[1.4rem] sm:text-[1.75rem] md:text-[1.95rem] font-black uppercase tracking-tight leading-none mb-1.5"
                      style={{ fontFamily: "'Poppins', sans-serif", color: "#FFFFFF" }}
                    >
                      {cat.name}
                    </h3>
                    <p className="text-white/90 text-[11px] sm:text-xs mb-3 sm:mb-4 leading-relaxed line-clamp-2 sm:line-clamp-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {cat.description}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(cat.id); }}
                      className="group/btn relative w-full py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase cursor-pointer rounded-lg overflow-hidden transition-all duration-300"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        background: "rgba(255,255,255,0.1)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.55)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        boxShadow: "0 0 0px rgba(255,255,255,0), inset 0 0 0px rgba(255,255,255,0)",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.color = accent;
                        e.currentTarget.style.borderColor = "#ffffff";
                        e.currentTarget.style.boxShadow = `0 0 16px rgba(255,255,255,0.55), 0 0 34px ${accent}80, inset 0 0 12px rgba(255,255,255,0.4)`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)";
                        e.currentTarget.style.boxShadow = "0 0 0px rgba(255,255,255,0), inset 0 0 0px rgba(255,255,255,0)";
                      }}
                    >
                      <span
                        className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
                        style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)" }}
                      />
                      <span className="relative flex items-center justify-center gap-1.5 truncate px-1">
                        Shop {cat.name}
                        <ChevronRight size={12} className="transition-transform duration-300 group-hover/btn:translate-x-1 shrink-0" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PER-CATEGORY PRODUCT SHOWCASE */}
      <section id="all-products" className="relative py-6 pb-14 sm:pb-20 px-4 sm:px-6 md:px-14 lg:px-20" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(16,185,129,0.5))" }}/>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.35em] sm:tracking-[0.45em] uppercase text-emerald-500 whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>Shop By Category</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(16,185,129,0.5))" }}/>
          </div>
         <h2 className="text-center font-black tracking-tight text-gray-900 whitespace-nowrap sm:whitespace-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.4rem, 7vw, 4.5rem)", lineHeight: 0.95 }}>
            EXPLORE ALL <span className="text-gold">PRODUCTS</span>
          </h2>
          <p className="text-center text-gray-400 sm:text-white/50 text-xs sm:text-sm mt-3 px-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Precision-formulated. Clinically dosed. Zero compromise.</p>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col gap-10 sm:gap-14 md:gap-16">
          {categories.map((cat) => {
            const accent = cat.accentColor || cat.accent_color || "#10B981";
            const catProducts = products
              .filter((p) => (String(p.category) === String(cat.id)) && (p.isActive !== false))
              .sort((a, b) => b.reviews - a.reviews)
              .slice(0, 4);

            if (catProducts.length === 0) return null;

            return (
              <div key={`shelf-${cat.id}`}>
                <div className="flex flex-wrap items-center sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="min-w-0">
                    <p
                      className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-1"
                      style={{ color: accent, fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {cat.tagline}
                    </p>
                    <h3
                      className="text-lg sm:text-2xl md:text-[1.85rem] font-black uppercase tracking-tight leading-none"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#0b0b0bff" }}
                    >
                      {cat.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => onNavigate(cat.id)}
                    className="group/viewall shrink-0 flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase cursor-pointer whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all duration-300"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: accent,
                      background: `${accent}0d`,
                      border: `1px solid ${accent}40`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${accent}1a`;
                      e.currentTarget.style.borderColor = `${accent}99`;
                      e.currentTarget.style.boxShadow = `0 0 16px ${accent}4d, inset 0 0 8px ${accent}1a`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = `${accent}0d`;
                      e.currentTarget.style.borderColor = `${accent}40`;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                    View All
                    <span className="relative flex items-center overflow-hidden w-3 h-3.5">
                      <ChevronRight size={13} className="absolute transition-transform duration-300 group-hover/viewall:translate-x-4" />
                      <ChevronRight size={13} className="absolute -translate-x-4 transition-transform duration-300 group-hover/viewall:translate-x-0" />
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {catProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      accent={accent}
                      onOpenDetails={onOpenDetails}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST AND VALUES SECTION */}
      <section className="py-6 sm:py-8 px-4 sm:px-6 md:px-14" style={{ background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:flex sm:flex-wrap justify-center md:justify-between gap-x-4 gap-y-5 sm:gap-x-6 md:gap-0">
          {[
            { icon: Shield, label: "Third-Party Lab Tested", sub: "Every batch verified" },
            { icon: Star, label: "4.9/5 Average Rating", sub: "From 12,000+ reviews" },
            { icon: Leaf, label: "No Artificial Fillers", sub: "Clean label promise" },
            { icon: Zap, label: "Fast UK Dispatch", sub: "Next-day available" }
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
                <Icon size={14} className="sm:hidden" style={{ color: "#10B981" }}/>
                <Icon size={15} className="hidden sm:block" style={{ color: "#10B981" }}/>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-semibold text-gray-700 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
                <div className="text-[9px] sm:text-[10px] text-gray-400 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};