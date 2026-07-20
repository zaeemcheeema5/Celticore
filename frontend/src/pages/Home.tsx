import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shield, Star, Leaf, Zap, Droplets, Sun } from 'lucide-react';
import { Category } from '../types';

import apexWheyImage from "../assets/apex_whey_protein.png";
import thunderPreWorkoutImage from "../assets/thunder_pre_workout.png";
import celticCreatineImage from "../assets/celtic_creatine.png";

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

export const Home: React.FC<HomeProps> = ({ onNavigate, categories }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#050505" }}>
        {/* Dynamic gradient background overlays with transition */}
        {HERO_SLIDES.map((s, idx) => (
          <div 
            key={`bg-grad-${idx}`}
            className="absolute inset-0 transition-opacity duration-1000 animate-fade"
            style={{
              background: idx === 0 
                ? "linear-gradient(135deg, #1f2937 0%, #080d0a 55%, #022c22 100%)" 
                : idx === 1 
                ? "linear-gradient(135deg, #0f0a05 0%, #050505 55%, #451a03 100%)" 
                : "linear-gradient(135deg, #05070a 0%, #050505 55%, #082d47 100%)",
              opacity: currentSlide === idx ? 1 : 0,
              zIndex: 0,
            }}
          />
        ))}

        {/* BG image */}
        <div key={`bg-${currentSlide}`} className="absolute inset-0 transition-opacity duration-1000 z-[1]">
          <img src={slide.bgImage} alt="" className="w-full h-full object-cover opacity-[0.08]" style={{ filter: "saturate(0.4) contrast(1.1)" }}/>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(5,5,5,0.7) 40%, transparent 100%)" }}/>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,5,0.7) 0%, transparent 60%)" }}/>
        </div>

        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
          <div className="absolute rounded-full blur-[130px] opacity-[0.14]" style={{ width: 550, height: 550, background: slide.accent, top: "5%", left: "-8%", transition: "background 1s ease-in-out", animation: "float 10s 0s infinite ease-in-out" }}/>
          <div className="absolute rounded-full blur-[110px] opacity-[0.10]" style={{ width: 440, height: 440, background: slide.accent === "#10B981" ? "#4b5563" : "#000", bottom: "5%", right: "-6%", transition: "background 1s ease-in-out", animation: "float 13s 3s infinite ease-in-out" }}/>
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(${slide.accent} 1px, transparent 1px), linear-gradient(90deg, ${slide.accent} 1px, transparent 1px)`, backgroundSize: "72px 72px", transition: "all 1s ease-in-out" }}/>
          <div className="absolute left-0 right-0 h-px opacity-[0.08]" style={{ background: `linear-gradient(to right, transparent, ${slide.accent} 40%, ${slide.accent} 60%, transparent)`, transition: "all 1s ease-in-out", animation: "scan-line 8s linear infinite" }}/>
        </div>

        {/* Floating particles */}
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none z-[2]" style={{ left: `${(i*37+7)%100}%`, top: `${(i*61+13)%100}%`, width: [2,2,1,3][i%4], height: [2,2,1,3][i%4], background: i%2===0 ? slide.accent : "#ffffff", opacity: 0.15+(i%4)*0.08, transition: "background 1s ease-in-out", animation: `float ${4+(i%5)}s ${(i*0.35)%4}s infinite ease-in-out` }}/>
        ))}

        <div className="relative z-10 w-full px-6 md:px-14 lg:px-20 pt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-screen py-16">
            {/* Slide Information */}
            <div key={`txt-${currentSlide}`} className="hero-text-enter">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-[10px] font-bold tracking-[0.35em] uppercase" style={{ border: `1px solid ${slide.accent}`, color: slide.accent, background: `${slide.accent}12`, fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: slide.accent }}/>
                {slide.tag}
              </div>
              <h1 className="font-black leading-[0.9] mb-3 text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 8vw, 6.5rem)", letterSpacing: "-0.02em" }}>
                {slide.title}<br/>
                <span style={{ color: slide.accent }}>
                  {slide.titleAccent}
                </span>
              </h1>
              <p className="text-sm font-semibold tracking-[0.25em] uppercase mb-4" style={{ color: slide.accent, fontFamily: "'DM Sans', sans-serif", opacity: 0.85 }}>{slide.subtitle}</p>
              <p className="text-white/50 text-[0.95rem] leading-relaxed mb-8 max-w-[420px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{slide.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => onNavigate(slide.page)} className="px-8 py-3.5 font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 cursor-pointer" style={{ fontFamily: "'Barlow Condensed', sans-serif", background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}bb)`, color: "#000", boxShadow: `0 0 28px ${slide.accent}40` }}>
                  {slide.cta}
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('footer-contact');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-7 py-3.5 font-black text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all duration-250 cursor-pointer"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", border: "1px solid rgba(255,255,255,0.15)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}
                >
                  Learn More
                </button>
              </div>
              <div className="flex gap-8 mt-10">
                {[{ val: "50K+", label: "Athletes" }, { val: "4.9★", label: "Avg Rating" }, { val: "100%", label: "Lab-Tested" }].map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{s.val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Rendering */}
            <div key={`img-${currentSlide}`} className="hero-visual-enter flex items-center justify-center h-80 md:h-[500px] lg:h-[560px]">
              <div 
                className="relative w-full h-full max-w-lg flex items-center justify-center"
                style={{
                  maskImage: 'radial-gradient(ellipse at 50% 50%, black 45%, transparent 78%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 45%, transparent 78%)',
                }}
              >
                {/* Glow behind product */}
                <div className="absolute w-[85%] h-[85%] rounded-full blur-[90px] opacity-30" style={{ background: slide.accent }}/>
                <img 
                  src={slide.bgImage} 
                  alt={slide.titleAccent} 
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-5 z-10">
          <button onClick={() => setCurrentSlide((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="p-1.5 text-white/30 hover:text-white/80 transition-colors cursor-pointer"><ChevronLeft size={18}/></button>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className="transition-all duration-400 cursor-pointer" style={{ width: i === currentSlide ? 28 : 7, height: 2, background: i === currentSlide ? slide.accent : "rgba(255,255,255,0.25)" }}/>
            ))}
          </div>
          <button onClick={() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length)} className="p-1.5 text-white/30 hover:text-white/80 transition-colors cursor-pointer"><ChevronRight size={18}/></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #050505)" }}/>
      </section>

      {/* CATEGORY EXPLORATION */}
      <section className="relative py-6 pb-28 px-6 md:px-14 lg:px-20" style={{ background: "#050505" }}>
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(16,185,129,0.5))" }}/>
            <span className="text-[10px] font-bold tracking-[0.45em] uppercase text-emerald-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>Our Range</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(16,185,129,0.5))" }}/>
          </div>
          <h2 className="text-center font-black tracking-tight text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.4rem, 5vw, 4.5rem)", lineHeight: 0.95 }}>
            EXPLORE THE <span className="text-gold">COLLECTION</span>
          </h2>
          <p className="text-center text-white/40 text-sm mt-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Precision-formulated. Clinically dosed. Zero compromise.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.id);
            const accent = cat.accentColor || cat.accent_color || "#10B981";
            const cardImg = cat.cardImage || cat.card_image || cat.image || "";
            return (
              <div
                key={cat.id}
                className="group relative overflow-hidden cursor-pointer category-card"
                style={{
                  background: "#0a0a0a",
                  border: `1px solid ${hoveredCard === cat.id ? `${accent}45` : "rgba(255,255,255,0.06)"}`,
                  aspectRatio: "16/10",
                  boxShadow: hoveredCard === cat.id ? `0 8px 40px ${accent}18` : "none"
                }}
                onMouseEnter={() => setHoveredCard(cat.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onNavigate(cat.id)}
              >
                {/* Category Graphic */}
                <img src={cardImg} alt={cat.name} className="absolute inset-0 w-full h-full object-cover opacity-[0.18] group-hover:opacity-[0.28] transition-opacity duration-500"/>
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.75) 100%)` }}/>

                {/* Hover Ambient Radial Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 80%, ${accent}12 0%, transparent 65%)` }}/>

                {/* SVG Micro-effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none">
                  <CardEffect effect={cat.effect} color={accent}/>
                </div>

                {/* Large Background Ghost Icon */}
                <div className="absolute -bottom-3 -right-3 opacity-[0.05] group-hover:opacity-[0.09] transition-opacity duration-400 pointer-events-none">
                  <Icon size={110} style={{ color: accent }}/>
                </div>

                {/* Information */}
                <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 flex items-center justify-center" style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                      <Icon size={16} style={{ color: accent }}/>
                    </div>
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1" style={{ color: accent, fontFamily: "'DM Sans', sans-serif" }}>
                      View All <ChevronRight size={10}/>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.25em] uppercase mb-1" style={{ color: accent, fontFamily: "'DM Sans', sans-serif" }}>{cat.tagline}</p>
                    <h3 className="text-2xl md:text-[1.65rem] font-black uppercase tracking-tight text-white leading-none mb-1.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{cat.name}</h3>
                    <p className="text-white/40 text-xs mb-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{cat.description}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(cat.id); }}
                      className="w-full py-2 text-[10px] font-black tracking-[0.25em] uppercase transition-all duration-250 cursor-pointer"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", background: `${accent}12`, border: `1px solid ${accent}30`, color: accent }}
                      onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "#000"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${accent}12`; e.currentTarget.style.color = accent; }}
                    >
                      Shop {cat.name}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST AND VALUES SECTION */}
      <section className="py-8 px-6 md:px-14" style={{ background: "#080808", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between gap-6 md:gap-0">
          {[
            { icon: Shield, label: "Third-Party Lab Tested", sub: "Every batch verified" },
            { icon: Star, label: "4.9/5 Average Rating", sub: "From 12,000+ reviews" },
            { icon: Leaf, label: "No Artificial Fillers", sub: "Clean label promise" },
            { icon: Zap, label: "Fast UK Dispatch", sub: "Next-day available" }
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
                <Icon size={15} style={{ color: "#10B981" }}/>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/80" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
                <div className="text-[10px] text-white/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
