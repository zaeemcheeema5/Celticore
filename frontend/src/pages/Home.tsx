import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight, Shield, ShieldCheck, Star, Leaf, Zap, Droplets, Sun, Dumbbell, Flame, Sparkles } from 'lucide-react';
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
// snapping backward to loop — the reset back to the real index 0 happens
// instantly (transition off) once the clone is fully in view, which is
// invisible since it's the same picture.
const HERO_BACKGROUNDS_LOOP = [...HERO_BACKGROUNDS, HERO_BACKGROUNDS[0]];

interface HomeProps {
  onNavigate: (page: string) => void;
  categories: Category[];
  products: Product[];
  onOpenDetails: (product: Product) => void;
}


// Maps icon name from category string/model to React components.
// Each category gets a genuinely distinct icon — Zap previously showed up
// on creatine, pre-workout, AND the fallback, which read as repetitive.
// Now it only appears on pre-workout, where an energy-burst mark actually fits.
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

export const Home: React.FC<HomeProps> = ({ onNavigate, categories, products, onOpenDetails }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Hero background carousel — slides through all 4 photos, left → right,
  // one at a time, always moving forward (never snapping back to slide 1).
  const [bgIndex, setBgIndex] = useState(0);
  const [bgTransitionOn, setBgTransitionOn] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setBgIndex((i) => i + 1), 4200);
    return () => clearInterval(t);
  }, []);

  // Once the strip has slid onto the appended clone of slide 1, jump back
  // to the real index 0 with the transition briefly switched off, so the
  // loop point is invisible and every subsequent slide keeps moving forward.
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
      {/* HERO SECTION — photo-real gym backdrop (src/assets/background.png)
          with animated colored smoke rising behind the product bottles. */}
      <section
        className="celticore-photo-hero relative min-h-[92svh] sm:min-h-screen flex items-center overflow-hidden"
      >
        <style>{`
          /* 4-photo hero carousel — each slide sits side by side and the
             whole strip translates so the active photo slides in from the
             left and pushes the previous one off to the right. */
          .hero-photo-track {
            position:absolute; inset:0; display:flex;
            width:${HERO_BACKGROUNDS_LOOP.length * 100}%;
          }
          /* overflow:hidden here is what contains each slide's own Ken
             Burns zoom to its own box — without it, a scaled-up slide
             (even one waiting off-screen) renders past its box edge and
             bleeds a sliver of itself into the neighboring slide. */
          .hero-photo-slide {
            position:relative; flex-shrink:0; overflow:hidden;
            width:${100 / HERO_BACKGROUNDS_LOOP.length}%; height:100%;
          }
          .hero-photo-slide-img {
            position:absolute; inset:0;
            background-size:cover; background-position:center 38%;
            animation: kenBurns 22s ease-in-out infinite alternate;
          }
          @keyframes kenBurns {
            0%   { transform:scale(1) translate(0,0); }
            100% { transform:scale(1.08) translate(-1%, -1.5%); }
          }

          /* Left-to-right dark wash so the headline stays legible over the
             photo without hiding the product shot on the right. */
          .hero-photo-scrim {
            position:absolute; inset:0; pointer-events:none;
            background:
              linear-gradient(90deg, rgba(3,10,8,.92) 0%, rgba(3,10,8,.82) 28%, rgba(3,10,8,.38) 52%, rgba(3,10,8,.12) 68%, rgba(3,10,8,.05) 100%),
              linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 28%),
              linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 18%);
          }

          /* Periodic diagonal light sweep across the whole hero for extra
             motion in the background. */
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

          /* Real rising smoke behind the bottles — tall, narrow, soft-edged
             tendrils that sway side to side and stretch/fade as they climb,
             built from stacked blurred ellipses per column so the stream
             looks continuous rather than one shape pulsing in place. This
             sits on its own fixed overlay (not inside a sliding photo
             slide), so it can never bleed across slide edges. */
          .hero-smoke-col { position:absolute; bottom:4%; pointer-events:none; }
          .hero-smoke-wisp {
            position:absolute; bottom:0; left:50%;
            border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
            filter: blur(16px);
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

          /* Soft pulsing glow seated at the base of each smoke column, as
             if light were spilling out from behind the bottle. */
          .hero-smoke-glow { position:absolute; bottom:-6%; left:50%; translate:-50% 0; border-radius:50%; filter:blur(22px); animation:smokeGlowPulse 3.4s ease-in-out infinite; pointer-events:none; }
          @keyframes smokeGlowPulse { 0%,100% { opacity:.35; transform:translate(-50%,0) scale(1); } 50% { opacity:.65; transform:translate(-50%,0) scale(1.18); } }

          .hero-enter { animation:heroEnter .8s cubic-bezier(.2,.75,.25,1) both; }
          @keyframes heroEnter { from {opacity:0; transform:translateY(22px)} to {opacity:1; transform:translateY(0)} }

          .hero-heading-glow { text-shadow: 0 3px 24px rgba(0,0,0,.65); }
          /* Rich color cycle for "FUEL GROWTH." — hard color bands sweep
             left → right continuously, each new color taking over from
             roughly where the last one ended, about once per second. */
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

          .hero-badge-dot { position:relative; }
          .hero-badge-dot::after {
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
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-20 flex items-center gap-2">
          {HERO_BACKGROUNDS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setBgTransitionOn(true); setBgIndex(i); }}
              aria-label={`Show background ${i + 1}`}
              className="transition-all duration-300 cursor-pointer rounded-full"
              style={{
                width: i === (bgIndex % HERO_BACKGROUNDS.length) ? 22 : 7,
                height: 7,
                background: i === (bgIndex % HERO_BACKGROUNDS.length) ? '#10B981' : 'rgba(255,255,255,0.35)',
                boxShadow: i === (bgIndex % HERO_BACKGROUNDS.length) ? '0 0 10px rgba(16,185,129,.8)' : 'none',
              }}
            />
          ))}
        </div>

        <div className="hero-photo-scrim" />
        <div className="hero-light-sweep" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-14 lg:px-20 pt-16 sm:pt-20 pb-24 sm:pb-28">
          <div className="hero-enter max-w-[640px]">
            <div className="hero-badge-dot inline-flex items-center gap-2.5 px-3.5 py-2 mb-6 border border-emerald-400/50 bg-emerald-400/[0.08] text-emerald-300 text-[9px] sm:text-[10px] font-bold tracking-[.3em] uppercase backdrop-blur-sm rounded-full" style={{fontFamily:"'DM Sans',sans-serif"}}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981]"/>
              Premium Supplements
            </div>

            <h1 className="hero-heading-glow font-black uppercase leading-[.96] tracking-[-.025em] text-white mb-6" style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(2.9rem, 6.2vw, 5.4rem)"}}>
              BUILD MUSCLE.
              <br />
              <span className="hero-heading-accent">FUEL GROWTH.</span>
            </h1>

            <p className="max-w-[460px] text-sm sm:text-base leading-7 text-zinc-200 mb-9" style={{fontFamily:"'DM Sans',sans-serif"}}>
              Premium quality supplements for peak performance, faster recovery and a stronger you.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-12">
              <button onClick={() => document.getElementById('all-products')?.scrollIntoView({behavior:'smooth'})} className="hero-cta-primary group inline-flex items-center justify-center gap-3 px-7 sm:px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[12px] tracking-[.15em] uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(16,185,129,.4)]" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
                <span className="relative z-10 inline-flex items-center gap-3">
                  Shop Now <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5"/>
                </span>
              </button>
              <button onClick={() => document.getElementById('footer-contact')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center justify-center px-7 sm:px-8 py-4 border border-white/40 text-white hover:border-emerald-400/80 hover:text-emerald-300 font-black text-[12px] tracking-[.15em] uppercase transition-all duration-300 hover:-translate-y-1" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
                Learn More
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              {[
                { icon: Dumbbell, val: '50K+', label: 'Athletes' },
                { icon: Star, val: '4.9★', label: 'Avg Rating' },
                { icon: ShieldCheck, val: '100%', label: 'Lab-Tested' },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className="hidden sm:block w-px h-9 bg-white/15" />}
                  <div className="hero-stat flex items-center gap-2.5 cursor-default">
                    <div className="hero-stat-icon w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-400/40 bg-emerald-400/10 flex items-center justify-center shrink-0">
                      <s.icon size={16} className="text-emerald-400" />
                    </div>
                    <div className="leading-tight">
                      <div className="hero-stat-val text-base sm:text-lg font-black text-white" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>{s.val}</div>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-[.14em] text-zinc-300" style={{fontFamily:"'DM Sans',sans-serif"}}>{s.label}</div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"/>
      </section>

      {/* CATEGORY EXPLORATION — Design 01 "Vivid Tiles" look, background driven by cat.accentColor, decorative motion driven by cat.effect (both set from Admin → Category Manager) */}
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
                {/* Decorative ring accent, matches Design 01 tile */}
                <span
                  className="absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full pointer-events-none"
                  style={{ border: "1.5px solid rgba(255,255,255,0.28)" }}
                />

                {/* Admin-controlled decorative effect layer — this is what
                    was previously defined but never rendered. Now it
                    actually reflects the "Animation Effect" chosen per
                    category in the Admin Dashboard. */}
                <CardEffect effect={cardEffect} color={accent} />

                {/* Subtle dark-to-transparent wash for text legibility, still shows accent color through */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)" }}
                />

                {/* Large translucent ghost icon */}
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-400 pointer-events-none">
                  <Icon size={72} className="sm:hidden" color="#ffffff" />
                  <Icon size={110} className="hidden sm:block" color="#ffffff" />
                </div>

                {/* Information */}
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
                {/* Category Shelf Header */}
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

                {/* Product Row */}
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