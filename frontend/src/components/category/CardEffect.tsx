import React from 'react';

/*
 * ============================================================
 * CARD EFFECT — shared decorative layer used by both the Home
 * page category tiles and the Category page's "More Categories"
 * tiles. Driven entirely by `cat.effect`, set from the Admin
 * Dashboard's "Animation Effect" dropdown (Category Manager tab).
 *
 * Each mark is built from real, physically-motivated motion —
 * ripples that actually expand and fade, a weight stack that
 * settles under its own light, sparks that orbit a core, a sun
 * that breathes, dust that drifts — using native SVG <animate> /
 * <animateTransform>, not a flat plane faked into 3D. Layers are
 * sized, blurred, and timed differently by apparent depth so
 * nearer elements move faster and brighter than farther ones,
 * which is what actually reads as depth.
 * ============================================================
 */
export function CardEffect({ effect, color }: { effect: string; color: string }) {
  const uid = color.replace("#", "");

  // -----------------------------------------------------------
  // STRENGTH — a stacked weight-plate silhouette that settles
  // under its own weight, with a slow glint sweeping the top
  // plate like light catching polished steel. Protein / Creatine.
  // -----------------------------------------------------------
  if (effect === "strength") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`str-glow-${uid}`} cx="74%" cy="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`str-shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx="230" cy="120" r="88" fill={`url(#str-glow-${uid})`} />

        {/* Stacked plates, back to front, each breathing very slightly
            out of phase so the stack feels like it's settling. */}
        <ellipse cx="230" cy="152" rx="72" ry="15" fill="#ffffff" opacity="0.12">
          <animate attributeName="cy" values="152;149;152" dur="6s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="230" cy="133" rx="67" ry="14" fill="#ffffff" opacity="0.17">
          <animate attributeName="cy" values="133;129;133" dur="6s" begin="0.2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="230" cy="114" rx="62" ry="13" fill="#ffffff" opacity="0.23">
          <animate attributeName="cy" values="114;109;114" dur="6s" begin="0.4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="230" cy="95" rx="57" ry="12" fill="#ffffff" opacity="0.3">
          <animate attributeName="cy" values="95;89;95" dur="6s" begin="0.6s" repeatCount="indefinite" />
        </ellipse>

        {/* Glint sweeping across the top plate */}
        <ellipse cx="180" cy="95" rx="16" ry="6" fill={`url(#str-shine-${uid})`}>
          <animate attributeName="cx" values="170;295;170" dur="5.5s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    );
  }

  // -----------------------------------------------------------
  // LIGHTNING — a faceted charge core that flickers irregularly,
  // like a live electrical crackle, with two brief spark pops.
  // Pre-Workout.
  // -----------------------------------------------------------
  if (effect === "lightning") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`shard-glow-${uid}`} cx="70%" cy="32%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="230" cy="56" r="80" fill={`url(#shard-glow-${uid})`}>
          <animate attributeName="r" values="76;86;76" dur="3.2s" repeatCount="indefinite" />
        </circle>

        <polygon points="230,16 264,58 230,100 196,58" fill="#ffffff" opacity="0.08" />

        <polygon points="230,16 264,58 230,100 196,58" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5">
          <animate attributeName="opacity" values="0.18;0.55;0.2;0.5;0.16" keyTimes="0;0.3;0.5;0.75;1" dur="2.6s" repeatCount="indefinite" />
        </polygon>
        <line x1="230" y1="16" x2="230" y2="100" stroke="#ffffff" strokeWidth="0.6" opacity="0.16">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.1s" begin="0.4s" repeatCount="indefinite" />
        </line>
        <line x1="196" y1="58" x2="264" y2="58" stroke="#ffffff" strokeWidth="0.6" opacity="0.16">
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.9s" begin="0.7s" repeatCount="indefinite" />
        </line>

        <circle cx="230" cy="56" r="3" fill="#ffffff" opacity="0.4">
          <animate attributeName="opacity" values="0.25;0.55;0.25" dur="1.6s" repeatCount="indefinite" />
        </circle>

        {/* Two brief spark pops at the shard's edges */}
        <circle cx="255" cy="70" r="1.6" fill="#ffffff">
          <animate attributeName="opacity" values="0;0;0.85;0;0;0" keyTimes="0;0.4;0.46;0.52;0.8;1" dur="3.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="206" cy="44" r="1.4" fill="#ffffff">
          <animate attributeName="opacity" values="0;0;0;0.7;0;0" keyTimes="0;0.55;0.62;0.66;0.75;1" dur="4.1s" begin="0.9s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  // -----------------------------------------------------------
  // RIPPLE — real expanding rings emitted continuously from a
  // source point, plus a couple of drifting droplets. BCAA /
  // Hydration.
  // -----------------------------------------------------------
  if (effect === "ripple") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`rip-glow-${uid}`} cx="78%" cy="64%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="236" cy="128" r="100" fill={`url(#rip-glow-${uid})`} />

        {[0, 1.5, 3].map((delay) => (
          <circle key={delay} cx="236" cy="128" r="8" stroke="#ffffff" strokeWidth="1.1" fill="none">
            <animate attributeName="r" values="6;92" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        <circle cx="236" cy="128" r="3.5" fill="#ffffff" opacity="0.3" />

        {/* Drifting droplets at different depths */}
        <circle cx="196" cy="150" r="2" fill="#ffffff" opacity="0.22">
          <animate attributeName="cy" values="150;142;150" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="268" cy="92" r="1.4" fill="#ffffff" opacity="0.18">
          <animate attributeName="cy" values="92;86;92" dur="4.4s" begin="0.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  // -----------------------------------------------------------
  // SOLAR — a breathing sun core with individually shimmering
  // rays, the whole field turning at true sundial pace. Vitamins.
  // -----------------------------------------------------------
  if (effect === "solar") {
    const rays = Array.from({ length: 12 }, (_, i) => i * 30);
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`sun-core-${uid}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="250" cy="50" r="60" fill={`url(#sun-core-${uid})`}>
          <animate attributeName="r" values="56;66;56" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="50" r="9" fill="#ffffff" opacity="0.34">
          <animate attributeName="opacity" values="0.28;0.42;0.28" dur="4s" repeatCount="indefinite" />
        </circle>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 250 50" to="360 250 50" dur="75s" repeatCount="indefinite" />
          {rays.map((a, i) => (
            <line
              key={a}
              x1={250 + 26 * Math.cos((a * Math.PI) / 180)}
              y1={50 + 26 * Math.sin((a * Math.PI) / 180)}
              x2={250 + (40 + (i % 3) * 5) * Math.cos((a * Math.PI) / 180)}
              y2={50 + (40 + (i % 3) * 5) * Math.sin((a * Math.PI) / 180)}
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.22"
            >
              <animate attributeName="opacity" values="0.12;0.32;0.12" dur={`${2.6 + (i % 4) * 0.5}s`} begin={`${i * 0.22}s`} repeatCount="indefinite" />
            </line>
          ))}
        </g>
      </svg>
    );
  }

  // -----------------------------------------------------------
  // CALM — soft waves sliding sideways in an endless loop, with
  // slow-rising dust motes drifting through. Wellbeing.
  // -----------------------------------------------------------
  if (effect === "calm") {
    // Two wave humps tiled edge-to-edge (0–150 and 150–300) so a
    // -150px translate loops seamlessly.
    const wavePath =
      "M -10 108 Q 27.5 92 65 108 T 140 108 Q 177.5 92 215 108 T 290 108";
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`calm-fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <g opacity="0.24">
          <path d={wavePath} stroke="#ffffff" strokeWidth="1.2" fill="none">
            <animateTransform attributeName="transform" type="translate" values="0 0; -150 0" dur="9s" repeatCount="indefinite" />
          </path>
          <path d={wavePath} stroke="#ffffff" strokeWidth="1.2" fill="none" transform="translate(150 0)">
            <animateTransform attributeName="transform" type="translate" values="150 0; 0 0" dur="9s" repeatCount="indefinite" />
          </path>
        </g>

        <g opacity="0.14">
          <path d={wavePath} stroke="#ffffff" strokeWidth="1" fill="none" transform="translate(0 28)">
            <animateTransform attributeName="transform" type="translate" values="0 28; -150 28" dur="13s" repeatCount="indefinite" />
          </path>
          <path d={wavePath} stroke="#ffffff" strokeWidth="1" fill="none" transform="translate(150 28)">
            <animateTransform attributeName="transform" type="translate" values="150 28; 0 28" dur="13s" repeatCount="indefinite" />
          </path>
        </g>

        <path d="M -10 150 Q 90 130 190 150 T 310 148 L 310 220 L -10 220 Z" fill={`url(#calm-fade-${uid})`} />

        {/* Slow-rising dust motes */}
        {[
          { cx: 90, r: 1.6, dur: "12s", begin: "0s" },
          { cx: 210, r: 1.2, dur: "15s", begin: "2s" },
          { cx: 150, r: 1, dur: "18s", begin: "5s" },
        ].map((d, i) => (
          <circle key={i} cx={d.cx} cy="190" r={d.r} fill="#ffffff">
            <animate attributeName="cy" values="190;10" dur={d.dur} begin={d.begin} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.28;0.28;0" keyTimes="0;0.15;0.8;1" dur={d.dur} begin={d.begin} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    );
  }

  // -----------------------------------------------------------
  // ENERGY (default) — a breathing core with sparks orbiting at
  // different radii, speeds and brightness, like embers around a
  // low fire. General / fallback.
  // -----------------------------------------------------------
  const orbits = [
    { r: 34, dur: "5s", size: 2.4, opacity: 0.4 },
    { r: 52, dur: "8s", size: 1.8, opacity: 0.3 },
    { r: 72, dur: "12s", size: 1.3, opacity: 0.2 },
  ];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`eng-${uid}`} cx="70%" cy="66%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="226" cy="138" rx="108" ry="84" fill={`url(#eng-${uid})`}>
        <animate attributeName="rx" values="104;114;104" dur="4.6s" repeatCount="indefinite" />
        <animate attributeName="ry" values="80;88;80" dur="4.6s" repeatCount="indefinite" />
      </ellipse>
      <circle cx="226" cy="138" r="5" fill="#ffffff" opacity="0.34" />

      {orbits.map((o, i) => (
        <g key={i} transform="translate(226 138)">
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0" to={i % 2 === 0 ? "360" : "-360"} dur={o.dur} repeatCount="indefinite" />
            <circle cx={o.r} cy="0" r={o.size} fill="#ffffff" opacity={o.opacity} />
          </g>
        </g>
      ))}
    </svg>
  );
}