import{c as y,u as ee,r as a,j as e,s as te,L as I,U as M,e as ae,M as se,v as re,q as ne,w as ie,S as le,t as n}from"./index-UYGQ3vGQ.js";import{A as E,S as oe,n as ce}from"./nutrition-DJQs9-MH.js";import{A as O}from"./arrow-right-DuBr2ZdW.js";import{M as de}from"./message-square-ByHyYJyT.js";import{A as me}from"./arrow-left-BAsn-Jc-.js";import{L as xe}from"./loader-circle-B9jGzpcZ.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]],he=y("calendar-days",pe);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}],["path",{d:"M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",key:"1uw2ng"}]],H=y("heart-pulse",ue);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=[["path",{d:"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",key:"icamh8"}],["path",{d:"m14.5 12.5 2-2",key:"inckbg"}],["path",{d:"m11.5 9.5 2-2",key:"fmmyf7"}],["path",{d:"m8.5 6.5 2-2",key:"vc6u1g"}],["path",{d:"m17.5 15.5 2-2",key:"wo5hmg"}]],ge=y("ruler",fe);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],W=y("target",be),S=[{id:"identity",label:"Identity",icon:M},{id:"vitals",label:"Vitals",icon:E},{id:"objective",label:"Objective",icon:W},{id:"wellbeing",label:"Wellbeing",icon:H}],Se=({isOpen:_=!0,onClose:i})=>{if(!_)return null;const{user:l}=ee(),[o,v]=a.useState(""),[c,j]=a.useState(""),[d,C]=a.useState(""),[m,z]=a.useState(""),[x,$]=a.useState("Male"),[p,A]=a.useState(""),[h,B]=a.useState(""),[u,G]=a.useState("Muscle Gain"),[f,T]=a.useState("Moderate"),[g,V]=a.useState("Vegetarian"),[P,L]=a.useState(""),[D,F]=a.useState(""),[k,q]=a.useState(!1),[s,N]=a.useState(0),b=a.useRef(null),Y=a.useRef(null);a.useEffect(()=>{l?(v(l.name||""),j(l.email||"")):(v(""),j(""))},[l]);const U=()=>{var t;(t=b.current)==null||t.scrollIntoView({behavior:"smooth",block:"start"})},Z=t=>t===0&&(!o.trim()||!c.trim()||!d.trim())?(n.error("Please share your name, email and phone number."),!1):t===1&&(!m.trim()||!x.trim()||!p.trim()||!h.trim())?(n.error("Please complete your vitals to continue."),!1):t===2&&(!u.trim()||!f.trim()||!g.trim())?(n.error("Please tell us your objective to continue."),!1):!0,K=()=>{var t;Z(s)&&(N(r=>Math.min(r+1,S.length-1)),(t=b.current)==null||t.scrollIntoView({behavior:"smooth",block:"start"}))},J=()=>{var t;N(r=>Math.max(r-1,0)),(t=b.current)==null||t.scrollIntoView({behavior:"smooth",block:"start"})},Q=async t=>{if(t.preventDefault(),!o.trim()||!c.trim()||!d.trim()||!m.trim()||!x.trim()||!p.trim()||!h.trim()||!u.trim()||!f.trim()||!g.trim()){n.error("Please fill in all the required fields.");return}q(!0);try{await ce.submitRequest({name:o,phone:d,email:c,age:Number(m),gender:x,weight:Number(p),height:Number(h),goal:u,activity_level:f,diet_preference:g,medical_conditions:P,notes:D}),n.success("Nutrition advice request submitted! Our trainers will review and send you an email."),C(""),z(""),A(""),B(""),L(""),F(""),N(0),i==null||i()}catch(r){n.error(r.message||"Failed to submit request.")}finally{q(!1)}};return e.jsxs("div",{className:"nc-root",children:[e.jsx("style",{children:`
        /* Barlow Condensed / DM Sans are now loaded once, site-wide, via
           index.html — see the comment there. This used to have its own
           @import for just this page, which meant every other page fell
           back to the browser's default font the whole time. */

        /* ── Design tokens — matched 1:1 to Home.tsx's palette ──
           white sections, gray-900/600/400 text, emerald-500 accent.
           Every border-radius below is UNCHANGED from the original file. */
        .nc-root {
          --ink: #111827;           /* text-gray-900, matches Home's headings */
          --ink-soft: #4b5563;      /* text-gray-600, matches Home's body copy */
          --ink-mute: #9ca3af;      /* text-gray-400, matches Home's stat labels */
          --emerald: #10B981;
          --emerald-soft: rgba(16,185,129,0.08);
          --hair: rgba(0,0,0,0.08); /* hairline borders, matches Home's rgba(0,0,0,0.06) dividers */
          background: #ffffff;
          color: var(--ink);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .nc-condensed { font-family: 'Barlow Condensed', sans-serif; }

        .nc-eyebrow {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-weight: 700;
          font-size: 10px;
          color: var(--emerald);
        }

        @keyframes nc-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nc-rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes nc-step-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Ambient blur blobs — same soft-glow device Home.tsx's hero uses
           (float animation, low opacity), recolored for a white backdrop. */
        .nc-orb-a {
          position: absolute; top: -10%; right: -8%; width: 550px; height: 550px;
          border-radius: 9999px;
          background: var(--emerald);
          opacity: 0.10;
          filter: blur(110px);
          animation: float 10s ease-in-out infinite;
          pointer-events: none;
        }
        .nc-orb-b {
          position: absolute; bottom: -15%; left: -10%; width: 440px; height: 440px;
          border-radius: 9999px;
          background: #4b5563;
          opacity: 0.06;
          filter: blur(90px);
          animation: float 13s 2s ease-in-out infinite;
          pointer-events: none;
        }

        .nc-fade-in { animation: nc-fade-up 0.9s ease both; }

        .nc-btn-primary {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: 13px;
          background: linear-gradient(135deg, #10B981, #10B981bb);
          color: #000;
          border: none;
          padding: 15px 30px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 28px rgba(16,185,129,0.35);
        }
        .nc-btn-primary:hover:not(:disabled) { transform: scale(1.05); }
        .nc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .nc-btn-ghost {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 700;
          font-size: 13px;
          background: transparent;
          color: var(--ink-soft);
          border: 1px solid rgba(0,0,0,0.15);
          padding: 15px 26px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .nc-btn-ghost:hover {
          color: var(--ink);
          border-color: rgba(0,0,0,0.35);
        }

        /* Card border-radius (6px) is unchanged from the original — only
           the surface, border, shadow and accent-line colors are new. */
        .nc-card {
          background: #ffffff;
          border: 1px solid var(--hair);
          box-shadow: 0 24px 70px rgba(17,24,39,0.08);
          border-radius: 6px;
          position: relative;
        }
        .nc-card::before {
          content: '';
          position: absolute; top: 0; left: 24px; right: 24px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--emerald), transparent);
          opacity: 0.6;
        }

        .nc-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-mute);
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 9px;
        }
        .nc-label svg { color: var(--emerald); flex-shrink: 0; }

        /* Input/select/textarea border-radius (3px) is unchanged. */
        .nc-input, .nc-select, .nc-textarea {
          width: 100%;
          background: #fafafa;
          border: 1px solid rgba(0,0,0,0.12);
          color: var(--ink);
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          border-radius: 3px;
          outline: none;
          transition: all 0.25s ease;
        }
        .nc-input::placeholder, .nc-textarea::placeholder { color: rgba(17,24,39,0.32); }
        .nc-input:focus, .nc-select:focus, .nc-textarea:focus {
          border-color: var(--emerald);
          background: #ffffff;
          box-shadow: 0 0 0 3px var(--emerald-soft);
        }
        .nc-select option { background: #ffffff; color: var(--ink); }
        .nc-textarea { resize: none; line-height: 1.65; }

        .nc-stage-track {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .nc-stage-track::before {
          content: '';
          position: absolute;
          top: 17px;
          left: 5%;
          right: 5%;
          height: 1px;
          background: rgba(0,0,0,0.08);
        }
        .nc-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          position: relative;
          z-index: 1;
          flex: 1;
        }
        /* Stage-dot stays a circle (50%) exactly as before. */
        .nc-stage-dot {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(0,0,0,0.14);
          background: #ffffff;
          transition: all 0.4s ease;
        }
        .nc-stage-dot.active {
          border-color: var(--emerald);
          background: var(--emerald-soft);
          box-shadow: 0 0 0 4px rgba(16,185,129,0.1), 0 0 18px rgba(16,185,129,0.25);
        }
        .nc-stage-dot.complete {
          border-color: var(--emerald);
          background: var(--emerald);
        }
        .nc-stage-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--ink-mute);
          transition: color 0.3s ease;
        }
        .nc-stage-label.active { color: var(--ink); }

        .nc-step-panel { animation: nc-step-enter 0.5s ease both; }

        .nc-ring-orbit {
          animation: nc-rotate-slow 40s linear infinite;
          transform-origin: center;
        }

        .nc-stat {
          border-left: 1px solid var(--hair);
          padding-left: 16px;
        }

        @media (max-width: 640px) {
          .nc-stage-label { display: none; }
        }
      `}),e.jsxs("section",{ref:Y,className:"relative min-h-screen flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-28 overflow-hidden",style:{background:"linear-gradient(135deg,#ffffff 0%,#f7faf9 55%,#eefaf5 100%)"},children:[e.jsx("div",{className:"nc-orb-a"}),e.jsx("div",{className:"nc-orb-b"}),i&&e.jsx("button",{onClick:i,className:"absolute top-8 right-8 sm:top-10 sm:right-12 text-[11px] tracking-[0.25em] uppercase text-gray-400 hover:text-gray-800 transition-colors z-10 nc-condensed font-bold cursor-pointer",children:"← Back"}),e.jsxs("div",{className:"relative z-[1] max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center",children:[e.jsxs("div",{className:"nc-fade-in",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1.5 mb-7 text-[9px] sm:text-[10px] font-bold tracking-[0.3em] sm:tracking-[0.35em] uppercase",style:{border:"1px solid #10B981",color:"#10B981",background:"rgba(16,185,129,0.10)",fontFamily:"'Barlow Condensed', sans-serif"},children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full animate-pulse",style:{background:"#10B981"}}),"Private Nutrition Consultancy"]}),e.jsxs("h1",{className:"font-black leading-[0.95] text-gray-900 mb-7",style:{fontFamily:"'Barlow Condensed', sans-serif",fontSize:"clamp(2.6rem, 6vw, 4.6rem)",letterSpacing:"-0.02em"},children:["PRECISION NUTRITION,",e.jsx("br",{}),e.jsx("span",{className:"text-gold",children:"PERSONALLY"})," YOURS"]}),e.jsx("p",{className:"text-gray-600 mb-10 max-w-xl text-sm sm:text-[0.95rem] leading-relaxed",style:{fontFamily:"'DM Sans', sans-serif"},children:"A guided intake with our certified trainers — no templates, no guesswork. Share your body, your goals and your lifestyle, and receive a supplement and nutrition advisory built around you alone."}),e.jsxs("div",{className:"flex flex-wrap items-center gap-5 mb-12",children:[e.jsxs("button",{onClick:U,className:"nc-btn-primary",children:["Begin Your Assessment",e.jsx(O,{size:15})]}),e.jsxs("div",{className:"flex items-center gap-2 text-gray-400 text-xs nc-condensed tracking-widest uppercase font-bold",children:[e.jsx(te,{size:13,className:"text-emerald-500"}),"Response within 24 hours"]})]}),e.jsxs("div",{className:"flex flex-wrap gap-x-10 gap-y-5",children:[e.jsxs("div",{className:"nc-stat",children:[e.jsx("div",{className:"font-black text-gray-900 text-lg sm:text-xl",style:{fontFamily:"'Barlow Condensed', sans-serif"},children:"4"}),e.jsx("div",{className:"text-gray-400 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1",children:"Guided Stages"})]}),e.jsxs("div",{className:"nc-stat",children:[e.jsx("div",{className:"font-black text-gray-900 text-lg sm:text-xl",style:{fontFamily:"'Barlow Condensed', sans-serif"},children:"1:1"}),e.jsx("div",{className:"text-gray-400 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1",children:"Certified Review"})]}),e.jsxs("div",{className:"nc-stat",children:[e.jsx("div",{className:"font-black text-gray-900 text-lg sm:text-xl",style:{fontFamily:"'Barlow Condensed', sans-serif"},children:"100%"}),e.jsx("div",{className:"text-gray-400 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1",children:"Personalized"})]})]})]}),e.jsxs("div",{className:"relative hidden lg:flex items-center justify-center nc-fade-in",style:{animationDelay:"0.2s"},children:[e.jsx("svg",{width:"380",height:"380",viewBox:"0 0 380 380",className:"nc-ring-orbit",children:e.jsx("circle",{cx:"190",cy:"190",r:"170",fill:"none",stroke:"rgba(16,185,129,0.16)",strokeWidth:"1",strokeDasharray:"2 8"})}),e.jsxs("svg",{width:"320",height:"320",viewBox:"0 0 320 320",className:"absolute",children:[e.jsx("circle",{cx:"160",cy:"160",r:"140",fill:"none",stroke:"rgba(0,0,0,0.06)",strokeWidth:"18"}),e.jsx("circle",{cx:"160",cy:"160",r:"140",fill:"none",stroke:"#10B981",strokeWidth:"18",strokeDasharray:`${2*Math.PI*140*.62} ${2*Math.PI*140}`,strokeLinecap:"round",transform:"rotate(-90 160 160)",opacity:"0.9"}),e.jsx("circle",{cx:"160",cy:"160",r:"104",fill:"none",stroke:"rgba(0,0,0,0.06)",strokeWidth:"16"}),e.jsx("circle",{cx:"160",cy:"160",r:"104",fill:"none",stroke:"#D4AF37",strokeWidth:"16",strokeDasharray:`${2*Math.PI*104*.44} ${2*Math.PI*104}`,strokeLinecap:"round",transform:"rotate(-90 160 160)",opacity:"0.9"}),e.jsx("circle",{cx:"160",cy:"160",r:"70",fill:"none",stroke:"rgba(0,0,0,0.06)",strokeWidth:"14"}),e.jsx("circle",{cx:"160",cy:"160",r:"70",fill:"none",stroke:"#3b82f6",strokeWidth:"14",strokeDasharray:`${2*Math.PI*70*.3} ${2*Math.PI*70}`,strokeLinecap:"round",transform:"rotate(-90 160 160)",opacity:"0.85"})]}),e.jsxs("div",{className:"absolute flex flex-col items-center text-center",children:[e.jsx(I,{size:22,className:"text-emerald-500 mb-2"}),e.jsx("span",{className:"nc-condensed text-gray-400 text-[10px] tracking-[0.25em] uppercase font-bold",children:"Protein · Carbs · Fat"})]})]})]})]}),e.jsxs("section",{ref:b,className:"relative px-6 sm:px-10 lg:px-20 py-24 sm:py-28",style:{background:"#E5F0EC"},children:[e.jsxs("div",{className:"max-w-3xl mx-auto mb-14",children:[e.jsxs("div",{className:"flex items-center gap-3 sm:gap-4 mb-3",children:[e.jsx("div",{className:"h-px flex-1",style:{background:"linear-gradient(to right, transparent, rgba(16,185,129,0.5))"}}),e.jsx("span",{className:"text-[9px] sm:text-[10px] font-bold tracking-[0.35em] sm:tracking-[0.45em] uppercase text-emerald-500 whitespace-nowrap",style:{fontFamily:"'DM Sans', sans-serif"},children:"The Assessment"}),e.jsx("div",{className:"h-px flex-1",style:{background:"linear-gradient(to left, transparent, rgba(16,185,129,0.5))"}})]}),e.jsxs("h2",{className:"text-center font-black tracking-tight text-gray-900",style:{fontFamily:"'Barlow Condensed', sans-serif",fontSize:"clamp(1.8rem, 3.4vw, 2.6rem)",lineHeight:.95},children:["FOUR STAGES TO ",e.jsx("span",{className:"text-gold",children:"YOUR PLAN"})]}),e.jsx("p",{className:"text-center text-gray-500 text-xs sm:text-sm mt-3",style:{fontFamily:"'DM Sans', sans-serif"},children:"Precision-formulated advice. Zero guesswork."})]}),e.jsxs("div",{className:"max-w-2xl mx-auto nc-card px-6 sm:px-10 py-10 sm:py-12",children:[e.jsx("div",{className:"nc-stage-track mb-12",children:S.map((t,r)=>{const X=t.icon,w=r===s,R=r<s;return e.jsxs("div",{className:"nc-stage",children:[e.jsx("div",{className:`nc-stage-dot ${w?"active":""} ${R?"complete":""}`,children:R?e.jsx(ae,{size:15,color:"#ffffff"}):e.jsx(X,{size:15,color:w?"#10B981":"rgba(17,24,39,0.35)"})}),e.jsx("span",{className:`nc-stage-label ${w?"active":""}`,children:t.label})]},t.id)})}),e.jsxs("form",{onSubmit:Q,children:[s===0&&e.jsxs("div",{className:"nc-step-panel flex flex-col gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(M,{size:12}),"Full Name"]}),e.jsx("input",{type:"text",required:!0,placeholder:"Your name",value:o,onChange:t=>v(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(se,{size:12}),"Email Address"]}),e.jsx("input",{type:"email",required:!0,placeholder:"you@example.com",value:c,onChange:t=>j(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(re,{size:12}),"Phone Number"]}),e.jsx("input",{type:"tel",required:!0,placeholder:"+44 123 456789",value:d,onChange:t=>C(t.target.value),className:"nc-input"})]})]}),s===1&&e.jsxs("div",{className:"nc-step-panel grid grid-cols-1 sm:grid-cols-2 gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(he,{size:12}),"Age"]}),e.jsx("input",{type:"number",required:!0,min:"1",placeholder:"24",value:m,onChange:t=>z(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(M,{size:12}),"Gender"]}),e.jsxs("select",{required:!0,value:x,onChange:t=>$(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Male",children:"Male"}),e.jsx("option",{value:"Female",children:"Female"}),e.jsx("option",{value:"Other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(oe,{size:12}),"Weight (kg)"]}),e.jsx("input",{type:"number",required:!0,min:"1",placeholder:"72",value:p,onChange:t=>A(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(ge,{size:12}),"Height (cm)"]}),e.jsx("input",{type:"number",required:!0,min:"1",placeholder:"178",value:h,onChange:t=>B(t.target.value),className:"nc-input"})]})]}),s===2&&e.jsxs("div",{className:"nc-step-panel flex flex-col gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(W,{size:12}),"Fitness Goal"]}),e.jsxs("select",{required:!0,value:u,onChange:t=>G(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Muscle Gain",children:"Muscle Gain"}),e.jsx("option",{value:"Weight Loss",children:"Weight Loss"}),e.jsx("option",{value:"Endurance",children:"Endurance"}),e.jsx("option",{value:"Maintenance",children:"Maintenance"}),e.jsx("option",{value:"Other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(E,{size:12}),"Activity Level"]}),e.jsxs("select",{required:!0,value:f,onChange:t=>T(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Sedentary",children:"Sedentary"}),e.jsx("option",{value:"Lightly Active",children:"Lightly Active"}),e.jsx("option",{value:"Moderate",children:"Moderate"}),e.jsx("option",{value:"Very Active",children:"Very Active"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(I,{size:12}),"Diet Preference"]}),e.jsxs("select",{required:!0,value:g,onChange:t=>V(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Standard",children:"Standard"}),e.jsx("option",{value:"Vegetarian",children:"Vegetarian"}),e.jsx("option",{value:"Vegan",children:"Vegan"}),e.jsx("option",{value:"Keto",children:"Keto"}),e.jsx("option",{value:"Paleo",children:"Paleo"}),e.jsx("option",{value:"Other",children:"Other"})]})]})]}),s===3&&e.jsxs("div",{className:"nc-step-panel flex flex-col gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(H,{size:12}),"Medical Conditions (Optional)"]}),e.jsx("textarea",{rows:3,placeholder:"List any existing medical conditions or allergies...",value:P,onChange:t=>L(t.target.value),className:"nc-textarea"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(de,{size:12}),"Additional Notes (Optional)"]}),e.jsx("textarea",{rows:3,placeholder:"Any additional details or questions for our trainers...",value:D,onChange:t=>F(t.target.value),className:"nc-textarea"})]})]}),e.jsxs("div",{className:"flex items-center justify-between mt-11",children:[s>0?e.jsxs("button",{type:"button",onClick:J,className:"nc-btn-ghost",children:[e.jsx(me,{size:14}),"Back"]}):e.jsx("span",{}),s<S.length-1?e.jsxs("button",{type:"button",onClick:K,className:"nc-btn-primary",children:["Continue",e.jsx(O,{size:15})]}):e.jsxs("button",{type:"submit",disabled:k,className:"nc-btn-primary",children:[k?e.jsx(xe,{size:15,className:"animate-spin"}):e.jsx(ne,{size:15}),k?"Submitting…":"Submit Request"]})]})]}),e.jsxs("div",{className:"flex items-center justify-center gap-2 mt-10 pt-8 text-[10px] text-gray-400 uppercase tracking-[0.2em] nc-condensed font-semibold",style:{borderTop:"1px solid var(--hair)"},children:[e.jsx(ie,{size:13,className:"text-emerald-500"}),"Reviewed personally by our certified trainers"]})]}),e.jsxs("div",{className:"flex items-center justify-center gap-2 mt-8 text-[11px] text-gray-400",children:[e.jsx(le,{size:12,className:"text-emerald-500"}),e.jsx("span",{className:"nc-condensed tracking-widest uppercase font-semibold",children:"Average response time: within 24 hours"})]})]})]})};export{Se as NutritionModal};
