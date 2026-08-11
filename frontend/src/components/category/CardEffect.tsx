import React from 'react';

/*
 * ============================================================
 * CARD EFFECT — shared decorative layer used by both the Home
 * page category tiles and the Category page's "More Categories"
 * tiles. Driven entirely by `cat.effect`, set from the Admin
 * Dashboard's "Animation Effect" dropdown (Category Manager tab).
 *
 * Design intent: each mark reads as an abstract brand signature —
 * fine linework, soft gradient light, asymmetric composition —
 * rather than a literal clip-art icon (a cartoon barbell, a
 * comic-book bolt, a kid's-drawing sun). Slow, quiet motion only;
 * nothing bounces or blinks.
 * ============================================================
 */
export function CardEffect({ effect, color }: { effect: string; color: string }) {
  const uid = color.replace("#", "");

  // -----------------------------------------------------------
  // STRENGTH — a rising bar cluster (progress, not a barbell),
  // fine diagonal accent lines, soft light behind.
  // -----------------------------------------------------------
  if (effect === "strength") {
    const bars = [
      { x: 196, h: 34, o: 0.16 },
      { x: 214, h: 50, o: 0.2 },
      { x: 232, h: 68, o: 0.24 },
      { x: 250, h: 90, o: 0.3 },
      { x: 268, h: 116, o: 0.36 },
    ];
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`str-glow-${uid}`} cx="72%" cy="38%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="222" cy="70" r="86" fill={`url(#str-glow-${uid})`} className="animate-pulse" style={{ animationDuration: "5s" }} />
        {bars.map((b, i) => (
          <rect
            key={b.x}
            x={b.x}
            y={186 - b.h}
            width="10"
            height={b.h}
            rx="2.5"
            fill="#ffffff"
            opacity={b.o}
            className="animate-pulse"
            style={{ animationDuration: `${4 + i * 0.4}s`, animationDelay: `${i * 0.25}s` }}
          />
        ))}
        <line x1="150" y1="176" x2="290" y2="176" stroke="#ffffff" strokeWidth="0.75" opacity="0.14" />
        <line x1="70" y1="40" x2="130" y2="66" stroke="#ffffff" strokeWidth="0.75" opacity="0.1" strokeLinecap="round" />
      </svg>
    );
  }

  // -----------------------------------------------------------
  // LIGHTNING — an abstract faceted shard cluster (a cut-gem
  // silhouette suggesting charge/voltage), not a literal bolt.
  // -----------------------------------------------------------
  if (effect === "lightning") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`shard-glow-${uid}`} cx="70%" cy="34%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`shard-edge-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="228" cy="58" r="82" fill={`url(#shard-glow-${uid})`} className="animate-pulse" style={{ animationDuration: "5.5s" }} />
        <polygon points="228,14 262,60 228,102 194,60" fill="#ffffff" opacity="0.08" />
        <polygon points="228,14 262,60 228,60" fill="#ffffff" opacity="0.1" />
        <polygon points="228,14 262,60 228,102 194,60" stroke={`url(#shard-edge-${uid})`} strokeWidth="1" opacity="0.5" />
        <line x1="228" y1="14" x2="228" y2="102" stroke="#ffffff" strokeWidth="0.6" opacity="0.16" />
        <line x1="194" y1="60" x2="262" y2="60" stroke="#ffffff" strokeWidth="0.6" opacity="0.16" />
        <circle cx="228" cy="58" r="3" fill="#ffffff" opacity="0.4" className="animate-pulse" style={{ animationDuration: "3.4s" }} />
      </svg>
    );
  }

  // -----------------------------------------------------------
  // RIPPLE — quiet partial arcs on an offset orbit, a few fine
  // scattered points. Reads as tide/current, not a cartoon splash.
  // -----------------------------------------------------------
  if (effect === "ripple") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`rip-glow-${uid}`} cx="78%" cy="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="238" cy="126" r="96" fill={`url(#rip-glow-${uid})`} />
        <path d="M 168 126 A 70 70 0 0 1 300 96" stroke="#ffffff" strokeWidth="1" opacity="0.2" fill="none" className="animate-pulse" style={{ animationDuration: "5s" }} />
        <path d="M 186 158 A 48 48 0 0 1 286 148" stroke="#ffffff" strokeWidth="1" opacity="0.16" fill="none" className="animate-pulse" style={{ animationDuration: "6s", animationDelay: "0.6s" }} />
        <path d="M 205 96 A 26 26 0 0 1 264 100" stroke="#ffffff" strokeWidth="1" opacity="0.22" fill="none" className="animate-pulse" style={{ animationDuration: "4.2s", animationDelay: "1.1s" }} />
        <circle cx="238" cy="126" r="3.5" fill="#ffffff" opacity="0.24" />
        <circle cx="196" cy="82" r="1.75" fill="#ffffff" opacity="0.22" className="animate-pulse" style={{ animationDuration: "4.4s" }} />
        <circle cx="272" cy="164" r="1.5" fill="#ffffff" opacity="0.18" className="animate-pulse" style={{ animationDuration: "5.2s", animationDelay: "0.8s" }} />
      </svg>
    );
  }

  // -----------------------------------------------------------
  // SOLAR — a quarter-fan dial of fine rays and a bright core,
  // like a light meter rather than a child's drawing of the sun.
  // -----------------------------------------------------------
  if (effect === "solar") {
    const rays = Array.from({ length: 9 }, (_, i) => -10 + i * 14);
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`sun-core-${uid}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="252" cy="48" r="64" fill={`url(#sun-core-${uid})`} className="animate-pulse" style={{ animationDuration: "5s" }} />
        <circle cx="252" cy="48" r="9" fill="#ffffff" opacity="0.32" />
        <circle cx="252" cy="48" r="22" stroke="#ffffff" strokeWidth="0.5" opacity="0.14" fill="none" />
        {rays.map((a, i) => (
          <line
            key={a}
            x1={252 + 28 * Math.cos((a * Math.PI) / 180)}
            y1={48 + 28 * Math.sin((a * Math.PI) / 180)}
            x2={252 + (40 + (i % 3) * 5) * Math.cos((a * Math.PI) / 180)}
            y2={48 + (40 + (i % 3) * 5) * Math.sin((a * Math.PI) / 180)}
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.22"
            className="animate-pulse"
            style={{ animationDuration: `${4 + (i % 4) * 0.5}s`, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </svg>
    );
  }

  // -----------------------------------------------------------
  // CALM — layered silk-like ribbon curves with a soft fade,
  // a couple of far, quiet points.
  // -----------------------------------------------------------
  if (effect === "calm") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`calm-fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`calm-ribbon-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M -20 104 C 60 76, 120 132, 200 100 S 320 90, 320 90" stroke={`url(#calm-ribbon-${uid})`} strokeWidth="1.25" fill="none" className="animate-pulse" style={{ animationDuration: "6s" }} />
        <path d="M -20 134 C 60 112, 120 158, 200 132 S 320 122, 320 122" stroke={`url(#calm-ribbon-${uid})`} strokeWidth="1" fill="none" opacity="0.7" className="animate-pulse" style={{ animationDuration: "7s", animationDelay: "1s" }} />
        <path d="M -20 160 Q 90 138 200 160 T 320 156 L 320 220 L -20 220 Z" fill={`url(#calm-fade-${uid})`} />
        <circle cx="96" cy="52" r="1.75" fill="#ffffff" opacity="0.2" className="animate-pulse" style={{ animationDuration: "4.6s" }} />
        <circle cx="250" cy="40" r="1.25" fill="#ffffff" opacity="0.16" className="animate-pulse" style={{ animationDuration: "5.4s", animationDelay: "1.2s" }} />
      </svg>
    );
  }

  // -----------------------------------------------------------
  // ENERGY (default) — an asymmetric fan of fine rays off a soft
  // glow, quieter and less "starburst" than a symmetric spark.
  // -----------------------------------------------------------
  const rays = [-70, -45, -18, 8, 32, 58, 84, 110, 140];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`eng-${uid}`} cx="70%" cy="66%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="226" cy="138" rx="112" ry="86" fill={`url(#eng-${uid})`} className="animate-pulse" style={{ animationDuration: "4.6s" }} />
      <circle cx="226" cy="138" r="5" fill="#ffffff" opacity="0.3" />
      <circle cx="226" cy="138" r="34" stroke="#ffffff" strokeWidth="0.5" opacity="0.14" fill="none" />
      {rays.map((a, i) => (
        <line
          key={a}
          x1={226 + 38 * Math.cos((a * Math.PI) / 180)}
          y1={138 + 38 * Math.sin((a * Math.PI) / 180)}
          x2={226 + (50 + (i % 3) * 7) * Math.cos((a * Math.PI) / 180)}
          y2={138 + (50 + (i % 3) * 7) * Math.sin((a * Math.PI) / 180)}
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
          className="animate-pulse"
          style={{ animationDuration: `${4 + (i % 3) * 0.6}s`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </svg>
  );
}