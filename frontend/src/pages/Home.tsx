import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shield, Star, Leaf, Zap, Droplets, Sun } from 'lucide-react';
import { Category, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import apexWheyImage from "../assets/apex_whey_protein.webp";
import thunderPreWorkoutImage from "../assets/thunder_pre_workout.webp";
import celticCreatineImage from "../assets/celtic_creatine.webp";

const HERO_SLIDES = [
  {
    id: 0,
    tag: "New Formula",
    title: "APEX WHEY",
    titleAccent: "PROTEIN",
    subtitle: "25g Pure Protein · Fast Absorption",
    description: "Precision-engineered for peak recovery. Micro-filtered cold-process whey with zero fillers and maximum bioavailability.",
    cta: "Shop Protein",
    page: "protein",
    accent: "#10B981",
    bgImage: apexWheyImage,
    glowColor: "rgba(16,185,129,0.28)",
  },
  {
    id: 1,
    tag: "Best Seller",
    title: "THUNDER",
    titleAccent: "PRE-WORKOUT",
    subtitle: "200mg Caffeine · Beta-Alanine · L-Citrulline",
    description: "Unleash explosive energy before every session. High-stim formula engineered for intensity, focus, and relentless drive.",
    cta: "Shop Pre-Workout",
    page: "pre-workout",
    accent: "#ff6b00",
    bgImage: thunderPreWorkoutImage,
    glowColor: "rgba(255,107,0,0.28)",
  },
  {
    id: 2,
    tag: "Premium Blend",
    title: "CELTIC",
    titleAccent: "CREATINE",
    subtitle: "5g Creatine Monohydrate + HCl",
    description: "Forge unbreakable strength. Clinically dosed dual-form creatine for maximum saturation and cellular power output.",
    cta: "Shop Creatine",
    page: "creatine",
    accent: "#3b82f6",
    bgImage: celticCreatineImage,
    glowColor: "rgba(59,130,246,0.22)",
  },
];

interface HomeProps {
  onNavigate: (page: string) => void;
  categories: Category[];
  products: Product[];
  onOpenDetails: (product: Product) => void;
}

function CardEffect({ effect, color }: { effect: string; color: string }) {
  if (effect === "lightning") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id={`gl-${color.replace("#","")}`}>
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
        </defs>
        <polyline points="170,10 145,90 170,90 130,190" stroke={color} strokeWidth="2" filter={`url(#gl-${color.replace("#","")})`} opacity="0.35" className="animate-pulse"/>
        <polyline points="195,25 175,85 195,85 160,180" stroke={color} strokeWidth="1" opacity="0.15" className="animate-pulse" style={{animationDelay:"0.4s"}}/>
      </svg>
    );
  }
  if (effect === "ripple") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none">
        <circle cx="240" cy="140" r="55" stroke={color} strokeWidth="0.75" opacity="0.22" className="animate-ping" style={{animationDuration:"3s"}}/>
        <circle cx="240" cy="140" r="30" stroke={color} strokeWidth="0.75" opacity="0.18" className="animate-ping" style={{animationDuration:"2s",animationDelay:"0.5s"}}/>
        <circle cx="240" cy="140" r="10" fill={color} opacity="0.2"/>
      </svg>
    );
  }
  if (effect === "solar") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none">
        <circle cx="250" cy="50" r="40" fill={color} opacity="0.08" className="animate-pulse"/>
        {[0,45,90,135,180,225,270,315].map(a=>(
          <line key={a} x1={250+42*Math.cos(a*Math.PI/180)} y1={50+42*Math.sin(a*Math.PI/180)} x2={250+58*Math.cos(a*Math.PI/180)} y2={50+58*Math.sin(a*Math.PI/180)} stroke={color} strokeWidth="1" opacity="0.2"/>
        ))}
      </svg>
    );
  }
  if (effect === "calm") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none">
        <path d="M 0 120 Q 75 90 150 120 Q 225 150 300 120" stroke={color} strokeWidth="0.75" opacity="0.2" className="animate-pulse" style={{animationDuration:"4s"}}/>
        <path d="M 0 145 Q 75 115 150 145 Q 225 175 300 145" stroke={color} strokeWidth="0.75" opacity="0.14" className="animate-pulse" style={{animationDuration:"5s",animationDelay:"1s"}}/>
      </svg>
    );
  }
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none">
      <defs>
        <radialGradient id={`rg-${color.replace("#","")}`} cx="70%" cy="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="220" cy="150" rx="100" ry="80" fill={`url(#rg-${color.replace("#","")})`}/>
    </svg>
  );
}

// Maps icon name from category string/model to React components
const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'protein': return Shield;
    case 'creatine': return Zap;
    case 'eaa-bcaa': return Droplets;
    case 'vitamins': return Sun;
    case 'pre-workout': return Zap;
    case 'wellbeing': return Leaf;
    default: return Zap;
  }
};

export const Home: React.FC<HomeProps> = ({ onNavigate, categories, products, onOpenDetails }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="w-full overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[92svh] sm:min-h-screen flex items-center overflow-hidden" style={{ background: "#ffffff" }}>
        {/* Dynamic gradient background overlays with transition */}
        {HERO_SLIDES.map((s, idx) => (
          <div 
            key={`bg-grad-${idx}`}
            className="absolute inset-0 transition-opacity duration-1000 animate-fade"
            style={{
              background: idx === 0 
                ? "linear-gradient(135deg,#ffffff 0%,#f7faf9 55%,#eefaf5 100%)"
                : idx === 1 
                ? "linear-gradient(135deg,#ffffff 0%,#fff9f2 60%,#fff3e5 100%)"
                : "linear-gradient(135deg,#ffffff 0%,#f5fbff 60%,#edf7ff 100%)",
              opacity: currentSlide === idx ? 1 : 0,
              zIndex: 0,
            }}
          />
        ))}

        {/* BG image */}
        <div key={`bg-${currentSlide}`} className="absolute inset-0 transition-opacity duration-1000 z-[1]">
          <img src={slide.bgImage} alt="" className="w-full h-full object-cover opacity-[0.08]" style={{ filter: "saturate(0.4) contrast(1.1)" }}/>
          <div className="absolute inset-0" style={{ background:"linear-gradient(to right, rgba(255,255,255,.92) 35%, rgba(255,255,255,.55) 70%, transparent)"  }}/>
          <div className="absolute inset-0" style={{ background:"linear-gradient(to top, rgba(255,255,255,.85) 0%, transparent 70%)" }}/>
        </div>

        {/* Ambient blobs - scaled down on small screens so they don't dominate the viewport */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
          <div className="absolute rounded-full blur-[70px] sm:blur-[100px] lg:blur-[130px] opacity-[0.14] w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] lg:w-[550px] lg:h-[550px]" style={{ background: slide.accent, top: "5%", left: "-8%", transition: "background 1s ease-in-out", animation: "float 10s 0s infinite ease-in-out" }}/>
          <div className="absolute rounded-full blur-[60px] sm:blur-[85px] lg:blur-[110px] opacity-[0.10] w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] lg:w-[440px] lg:h-[440px]" style={{ background: slide.accent === "#10B981" ? "#4b5563" : "#000", bottom: "5%", right: "-6%", transition: "background 1s ease-in-out", animation: "float 13s 3s infinite ease-in-out" }}/>
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(${slide.accent} 1px, transparent 1px), linear-gradient(90deg, ${slide.accent} 1px, transparent 1px)`, backgroundSize: "44px 44px", transition: "all 1s ease-in-out" }}/>
          <div className="absolute left-0 right-0 h-px opacity-[0.08]" style={{ background: `linear-gradient(to right, transparent, ${slide.accent} 40%, ${slide.accent} 60%, transparent)`, transition: "all 1s ease-in-out", animation: "scan-line 8s linear infinite" }}/>
        </div>

        {/* Floating particles - fewer / smaller on mobile via reduced opacity, kept lightweight */}
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none z-[2] hidden xs:block sm:block" style={{ left: `${(i*37+7)%100}%`, top: `${(i*61+13)%100}%`, width: [2,2,1,3][i%4], height: [2,2,1,3][i%4], background: i%2===0 ? slide.accent : "#ffffff", opacity: 0.15+(i%4)*0.08, transition: "background 1s ease-in-out", animation: `float ${4+(i%5)}s ${(i*0.35)%4}s infinite ease-in-out` }}/>
        ))}

        <div className="relative z-10 w-full px-4 sm:px-6 md:px-14 lg:px-20 pt-8 sm:pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-8 items-center min-h-[92svh] sm:min-h-screen py-8 sm:py-12 md:py-16">
            {/* Slide Information */}
            <div key={`txt-${currentSlide}`} className="hero-text-enter order-2 lg:order-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 sm:mb-6 text-[9px] sm:text-[10px] font-bold tracking-[0.3em] sm:tracking-[0.35em] uppercase" style={{ border: `1px solid ${slide.accent}`, color: slide.accent, background: `${slide.accent}12`, fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: slide.accent }}/>
                {slide.tag}
              </div>
              <h1 className="font-black leading-[0.95] sm:leading-[0.9] mb-3 text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.25rem, 12vw, 6.5rem)", letterSpacing: "-0.02em" }}>
                {slide.title}<br/>
                <span style={{ color: slide.accent }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-3 sm:mb-4" style={{ color: slide.accent, fontFamily: "'DM Sans', sans-serif", opacity: 0.85 }}>{slide.subtitle}</p>
              <p className="text-gray-600 text-sm sm:text-[0.95rem] leading-relaxed mb-6 sm:mb-8 max-w-[420px] mx-auto lg:mx-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>{slide.description}</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button onClick={() => onNavigate(slide.page)} className="px-6 sm:px-8 py-3 sm:py-3.5 font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 cursor-pointer" style={{ fontFamily: "'Barlow Condensed', sans-serif", background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}bb)`, color: "#000", boxShadow: `0 0 28px ${slide.accent}40` }}>
                  {slide.cta}
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('footer-contact');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 sm:px-7 py-3 sm:py-3.5 font-black text-xs tracking-[0.2em] uppercase text-gray-700 hover:text-white transition-all duration-250 cursor-pointer"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", border: "1px solid rgba(0,0,0,.15)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}
                >
                  Learn More
                </button>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-5 sm:gap-8 mt-8 sm:mt-10">
                {[{ val: "50K+", label: "Athletes" }, { val: "4.9★", label: "Avg Rating" }, { val: "100%", label: "Lab-Tested" }].map(s => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-lg sm:text-xl font-black text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{s.val}</div>
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Rendering — hidden on mobile (matches the Nutrition
                page's hero, which is text-only below its lg breakpoint),
                visible from tablet (md) upward. On mobile the grid simply
                falls back to a single centered text column. */}
            <div key={`img-${currentSlide}`} className="hidden md:flex hero-visual-enter order-1 lg:order-2 items-center justify-center md:h-[440px] lg:h-[560px]">
              <div 
                className="relative w-full h-full max-w-lg flex items-center justify-center"
                style={{
                  maskImage: 'radial-gradient(ellipse at 50% 50%, black 45%, transparent 78%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 45%, transparent 78%)',
                }}
              >
                {/* Glow behind product */}
                <div className="absolute w-[85%] h-[85%] rounded-full blur-[60px] sm:blur-[90px] opacity-30" style={{ background: slide.accent }}/>
                <img 
                  src={slide.bgImage} 
                  alt={slide.titleAccent} 
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-contain relative z-10" 
                  style={{ 
                    filter: "saturate(1.15) contrast(1.05)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carousel buttons */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-5 z-10">
          <button onClick={() => setCurrentSlide((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="p-2 sm:p-1.5 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"><ChevronLeft size={16} className="sm:hidden"/><ChevronLeft size={18} className="hidden sm:block"/></button>
          <div className="flex gap-2 items-center">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className="transition-all duration-400 cursor-pointer" style={{ width: i === currentSlide ? 24 : 6, height: 2, background: i === currentSlide ? slide.accent : "rgba(0,0,0,0.15)" }}/>
            ))}
          </div>
          <button onClick={() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length)} className="p-2 sm:p-1.5 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"><ChevronRight size={16} className="sm:hidden"/><ChevronRight size={18} className="hidden sm:block"/></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}/>
      </section>

      {/* CATEGORY EXPLORATION — Design 01 "Vivid Tiles" look, background driven by cat.accentColor */}
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
      <section className="relative py-6 pb-14 sm:pb-20 px-4 sm:px-6 md:px-14 lg:px-20" style={{ background: "#ffffff" }}>
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