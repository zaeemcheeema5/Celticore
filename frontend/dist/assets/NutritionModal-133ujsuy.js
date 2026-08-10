import{c as v,u as ee,r as a,j as e,k as te,L as F,U as M,b as ae,M as se,m as re,i as ne,n as ie,p as le,t as n}from"./index-5_qhiM0m.js";import{A as R,S as ce,n as oe}from"./nutrition-BXSQrobk.js";import{A as I}from"./arrow-right-CtTPwK1x.js";import{M as de}from"./message-square-DseMLups.js";import{A as me}from"./arrow-left-DwPjiiCO.js";import{L as xe}from"./loader-circle-v4ePJp5F.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]],he=v("calendar-days",pe);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}],["path",{d:"M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",key:"1uw2ng"}]],_=v("heart-pulse",ue);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=[["path",{d:"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",key:"icamh8"}],["path",{d:"m14.5 12.5 2-2",key:"inckbg"}],["path",{d:"m11.5 9.5 2-2",key:"fmmyf7"}],["path",{d:"m8.5 6.5 2-2",key:"vc6u1g"}],["path",{d:"m17.5 15.5 2-2",key:"wo5hmg"}]],fe=v("ruler",ge);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],$=v("target",be),S=[{id:"identity",label:"Identity",icon:M},{id:"vitals",label:"Vitals",icon:R},{id:"objective",label:"Objective",icon:$},{id:"wellbeing",label:"Wellbeing",icon:_}],Se=({isOpen:O=!0,onClose:i})=>{if(!O)return null;const{user:l}=ee(),[c,y]=a.useState(""),[o,j]=a.useState(""),[d,z]=a.useState(""),[m,C]=a.useState(""),[x,V]=a.useState("Male"),[p,A]=a.useState(""),[h,P]=a.useState(""),[u,G]=a.useState("Muscle Gain"),[g,T]=a.useState("Moderate"),[f,Y]=a.useState("Vegetarian"),[q,L]=a.useState(""),[E,W]=a.useState(""),[k,B]=a.useState(!1),[s,N]=a.useState(0),b=a.useRef(null),H=a.useRef(null);a.useEffect(()=>{l?(y(l.name||""),j(l.email||"")):(y(""),j(""))},[l]);const K=()=>{var t;(t=b.current)==null||t.scrollIntoView({behavior:"smooth",block:"start"})},U=t=>t===0&&(!c.trim()||!o.trim()||!d.trim())?(n.error("Please share your name, email and phone number."),!1):t===1&&(!m.trim()||!x.trim()||!p.trim()||!h.trim())?(n.error("Please complete your vitals to continue."),!1):t===2&&(!u.trim()||!g.trim()||!f.trim())?(n.error("Please tell us your objective to continue."),!1):!0,Z=()=>{var t;U(s)&&(N(r=>Math.min(r+1,S.length-1)),(t=b.current)==null||t.scrollIntoView({behavior:"smooth",block:"start"}))},J=()=>{var t;N(r=>Math.max(r-1,0)),(t=b.current)==null||t.scrollIntoView({behavior:"smooth",block:"start"})},Q=async t=>{if(t.preventDefault(),!c.trim()||!o.trim()||!d.trim()||!m.trim()||!x.trim()||!p.trim()||!h.trim()||!u.trim()||!g.trim()||!f.trim()){n.error("Please fill in all the required fields.");return}B(!0);try{await oe.submitRequest({name:c,phone:d,email:o,age:Number(m),gender:x,weight:Number(p),height:Number(h),goal:u,activity_level:g,diet_preference:f,medical_conditions:q,notes:E}),n.success("Nutrition advice request submitted! Our trainers will review and send you an email."),z(""),C(""),A(""),P(""),L(""),W(""),N(0),i==null||i()}catch(r){n.error(r.message||"Failed to submit request.")}finally{B(!1)}};return e.jsxs("div",{className:"nc-root",children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=DM+Sans:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&display=swap');

        .nc-root {
          --void: #050706;
          --emerald-deep: #071510;
          --emerald: #10B981;
          --emerald-soft: rgba(16,185,129,0.12);
          --gold: #C9A961;
          --gold-soft: rgba(201,169,97,0.35);
          --cream: #F5F2EA;
          background: var(--void);
          color: var(--cream);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .nc-serif { font-family: 'Fraunces', serif; }
        .nc-condensed { font-family: 'Barlow Condensed', sans-serif; }

        .nc-eyebrow {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 11px;
          color: var(--gold);
        }

        @keyframes nc-drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-2%, 3%) scale(1.05); }
        }
        @keyframes nc-drift-2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(3%, -2%) scale(1.08); }
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

        .nc-orb-a {
          position: absolute; top: -10%; right: -8%; width: 620px; height: 620px;
          background: radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0) 70%);
          animation: nc-drift 14s ease-in-out infinite;
          pointer-events: none;
        }
        .nc-orb-b {
          position: absolute; bottom: -15%; left: -10%; width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(201,169,97,0.10) 0%, rgba(201,169,97,0) 70%);
          animation: nc-drift-2 18s ease-in-out infinite;
          pointer-events: none;
        }

        .nc-fade-in { animation: nc-fade-up 0.9s ease both; }

        .nc-grain {
          position: absolute; inset: 0; opacity: 0.035; pointer-events: none; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .nc-btn-primary {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 700;
          font-size: 13px;
          background: linear-gradient(135deg, #10B981 0%, #067A56 100%);
          color: #04120C;
          border: 1px solid rgba(16,185,129,0.5);
          padding: 15px 30px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(.2,.8,.2,1);
          box-shadow: 0 0 0 rgba(16,185,129,0);
        }
        .nc-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(16,185,129,0.35), 0 0 0 1px var(--gold-soft);
        }
        .nc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .nc-btn-ghost {
          font-family: 'Barlow Condensed', sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 13px;
          background: transparent;
          color: rgba(245,242,234,0.55);
          border: 1px solid rgba(245,242,234,0.16);
          padding: 15px 26px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .nc-btn-ghost:hover {
          color: var(--cream);
          border-color: rgba(245,242,234,0.4);
        }

        .nc-card {
          background: linear-gradient(160deg, rgba(11,17,14,0.85) 0%, rgba(6,9,8,0.92) 100%);
          border: 1px solid rgba(16,185,129,0.16);
          backdrop-filter: blur(24px);
          box-shadow: 0 30px 90px rgba(0,0,0,0.55), 0 0 120px rgba(16,185,129,0.05);
          border-radius: 6px;
          position: relative;
        }
        .nc-card::before {
          content: '';
          position: absolute; top: 0; left: 24px; right: 24px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.6;
        }

        .nc-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(245,242,234,0.4);
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 9px;
        }
        .nc-label svg { color: var(--emerald); flex-shrink: 0; }

        .nc-input, .nc-select, .nc-textarea {
          width: 100%;
          background: rgba(16,185,129,0.045);
          border: 1px solid rgba(16,185,129,0.16);
          color: var(--cream);
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          border-radius: 3px;
          outline: none;
          transition: all 0.3s ease;
        }
        .nc-input::placeholder, .nc-textarea::placeholder { color: rgba(245,242,234,0.2); }
        .nc-input:focus, .nc-select:focus, .nc-textarea:focus {
          border-color: var(--gold);
          background: rgba(16,185,129,0.08);
          box-shadow: 0 0 0 3px rgba(201,169,97,0.08), 0 0 24px rgba(16,185,129,0.12);
        }
        .nc-select option { background: #090e0b; color: var(--cream); }
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
          background: rgba(245,242,234,0.1);
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
        .nc-stage-dot {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(245,242,234,0.16);
          background: var(--void);
          transition: all 0.4s ease;
        }
        .nc-stage-dot.active {
          border-color: var(--emerald);
          background: linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05));
          box-shadow: 0 0 0 4px rgba(16,185,129,0.1), 0 0 22px rgba(16,185,129,0.3);
        }
        .nc-stage-dot.complete {
          border-color: var(--gold);
          background: var(--gold);
        }
        .nc-stage-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          color: rgba(245,242,234,0.35);
          transition: color 0.3s ease;
        }
        .nc-stage-label.active { color: var(--cream); }

        .nc-step-panel { animation: nc-step-enter 0.5s ease both; }

        .nc-ring-orbit {
          animation: nc-rotate-slow 40s linear infinite;
          transform-origin: center;
        }

        .nc-stat {
          border-left: 1px solid rgba(201,169,97,0.3);
          padding-left: 16px;
        }

        @media (max-width: 640px) {
          .nc-stage-label { display: none; }
        }
      `}),e.jsx("div",{className:"nc-grain"}),e.jsxs("section",{ref:H,className:"relative min-h-screen flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-28 overflow-hidden",style:{background:"radial-gradient(ellipse 90% 60% at 30% 0%, rgba(16,185,129,0.10) 0%, transparent 55%), linear-gradient(180deg, #050706 0%, #071310 55%, #050706 100%)"},children:[e.jsx("div",{className:"nc-orb-a"}),e.jsx("div",{className:"nc-orb-b"}),i&&e.jsx("button",{onClick:i,className:"absolute top-8 right-8 sm:top-10 sm:right-12 text-[11px] tracking-[0.25em] uppercase text-white/35 hover:text-white/80 transition-colors z-10 nc-condensed font-semibold cursor-pointer",children:"← Back"}),e.jsxs("div",{className:"relative z-[1] max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center",children:[e.jsxs("div",{className:"nc-fade-in",children:[e.jsx("div",{className:"flex items-center gap-3 mb-7",children:e.jsx("span",{className:"nc-eyebrow",children:"Private Nutrition Consultancy"})}),e.jsxs("h1",{className:"nc-serif text-white leading-[1.04] mb-7",style:{fontSize:"clamp(2.6rem, 6vw, 4.6rem)",fontWeight:500},children:["Precision nutrition,",e.jsx("br",{}),e.jsx("span",{style:{fontStyle:"italic",color:"var(--emerald)"},children:"personally"})," yours."]}),e.jsx("p",{className:"text-white/55 mb-10 max-w-xl",style:{fontSize:"16px",lineHeight:1.8},children:"A guided intake with our certified trainers — no templates, no guesswork. Share your body, your goals and your lifestyle, and receive a supplement and nutrition advisory built around you alone."}),e.jsxs("div",{className:"flex flex-wrap items-center gap-5 mb-12",children:[e.jsxs("button",{onClick:K,className:"nc-btn-primary",children:["Begin Your Assessment",e.jsx(I,{size:15})]}),e.jsxs("div",{className:"flex items-center gap-2 text-white/35 text-xs nc-condensed tracking-widest uppercase font-semibold",children:[e.jsx(te,{size:13,className:"text-[var(--gold)]"}),"Response within 24 hours"]})]}),e.jsxs("div",{className:"flex flex-wrap gap-x-10 gap-y-5",children:[e.jsxs("div",{className:"nc-stat",children:[e.jsx("div",{className:"nc-serif text-white text-2xl",style:{fontWeight:500},children:"4"}),e.jsx("div",{className:"text-white/35 text-[10.5px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1",children:"Guided Stages"})]}),e.jsxs("div",{className:"nc-stat",children:[e.jsx("div",{className:"nc-serif text-white text-2xl",style:{fontWeight:500},children:"1:1"}),e.jsx("div",{className:"text-white/35 text-[10.5px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1",children:"Certified Review"})]}),e.jsxs("div",{className:"nc-stat",children:[e.jsx("div",{className:"nc-serif text-white text-2xl",style:{fontWeight:500},children:"100%"}),e.jsx("div",{className:"text-white/35 text-[10.5px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1",children:"Personalized"})]})]})]}),e.jsxs("div",{className:"relative hidden lg:flex items-center justify-center nc-fade-in",style:{animationDelay:"0.2s"},children:[e.jsx("svg",{width:"380",height:"380",viewBox:"0 0 380 380",className:"nc-ring-orbit",children:e.jsx("circle",{cx:"190",cy:"190",r:"170",fill:"none",stroke:"rgba(16,185,129,0.12)",strokeWidth:"1",strokeDasharray:"2 8"})}),e.jsxs("svg",{width:"320",height:"320",viewBox:"0 0 320 320",className:"absolute",children:[e.jsx("circle",{cx:"160",cy:"160",r:"140",fill:"none",stroke:"rgba(245,242,234,0.06)",strokeWidth:"18"}),e.jsx("circle",{cx:"160",cy:"160",r:"140",fill:"none",stroke:"#10B981",strokeWidth:"18",strokeDasharray:`${2*Math.PI*140*.62} ${2*Math.PI*140}`,strokeLinecap:"round",transform:"rotate(-90 160 160)",opacity:"0.85"}),e.jsx("circle",{cx:"160",cy:"160",r:"104",fill:"none",stroke:"rgba(245,242,234,0.06)",strokeWidth:"16"}),e.jsx("circle",{cx:"160",cy:"160",r:"104",fill:"none",stroke:"#C9A961",strokeWidth:"16",strokeDasharray:`${2*Math.PI*104*.44} ${2*Math.PI*104}`,strokeLinecap:"round",transform:"rotate(-90 160 160)",opacity:"0.85"}),e.jsx("circle",{cx:"160",cy:"160",r:"70",fill:"none",stroke:"rgba(245,242,234,0.06)",strokeWidth:"14"}),e.jsx("circle",{cx:"160",cy:"160",r:"70",fill:"none",stroke:"#5EEAD4",strokeWidth:"14",strokeDasharray:`${2*Math.PI*70*.3} ${2*Math.PI*70}`,strokeLinecap:"round",transform:"rotate(-90 160 160)",opacity:"0.75"})]}),e.jsxs("div",{className:"absolute flex flex-col items-center text-center",children:[e.jsx(F,{size:22,className:"text-[var(--emerald)] mb-2"}),e.jsx("span",{className:"nc-condensed text-white/40 text-[10px] tracking-[0.25em] uppercase font-semibold",children:"Protein · Carbs · Fat"})]})]})]})]}),e.jsxs("section",{ref:b,className:"relative px-6 sm:px-10 lg:px-20 py-24 sm:py-28",children:[e.jsxs("div",{className:"max-w-3xl mx-auto text-center mb-14",children:[e.jsx("span",{className:"nc-eyebrow",children:"The Assessment"}),e.jsx("h2",{className:"nc-serif text-white mt-4",style:{fontSize:"clamp(1.8rem, 3.4vw, 2.6rem)",fontWeight:500},children:"Four stages to your plan"}),e.jsx("div",{className:"w-16 h-px mx-auto mt-6",style:{background:"linear-gradient(90deg, transparent, var(--gold), transparent)"}})]}),e.jsxs("div",{className:"max-w-2xl mx-auto nc-card px-6 sm:px-10 py-10 sm:py-12",children:[e.jsx("div",{className:"nc-stage-track mb-12",children:S.map((t,r)=>{const X=t.icon,w=r===s,D=r<s;return e.jsxs("div",{className:"nc-stage",children:[e.jsx("div",{className:`nc-stage-dot ${w?"active":""} ${D?"complete":""}`,children:D?e.jsx(ae,{size:15,color:"#04120C"}):e.jsx(X,{size:15,color:w?"#10B981":"rgba(245,242,234,0.35)"})}),e.jsx("span",{className:`nc-stage-label ${w?"active":""}`,children:t.label})]},t.id)})}),e.jsxs("form",{onSubmit:Q,children:[s===0&&e.jsxs("div",{className:"nc-step-panel flex flex-col gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(M,{size:12}),"Full Name"]}),e.jsx("input",{type:"text",required:!0,placeholder:"Your name",value:c,onChange:t=>y(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(se,{size:12}),"Email Address"]}),e.jsx("input",{type:"email",required:!0,placeholder:"you@example.com",value:o,onChange:t=>j(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(re,{size:12}),"Phone Number"]}),e.jsx("input",{type:"tel",required:!0,placeholder:"+44 123 456789",value:d,onChange:t=>z(t.target.value),className:"nc-input"})]})]}),s===1&&e.jsxs("div",{className:"nc-step-panel grid grid-cols-1 sm:grid-cols-2 gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(he,{size:12}),"Age"]}),e.jsx("input",{type:"number",required:!0,min:"1",placeholder:"24",value:m,onChange:t=>C(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(M,{size:12}),"Gender"]}),e.jsxs("select",{required:!0,value:x,onChange:t=>V(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Male",children:"Male"}),e.jsx("option",{value:"Female",children:"Female"}),e.jsx("option",{value:"Other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(ce,{size:12}),"Weight (kg)"]}),e.jsx("input",{type:"number",required:!0,min:"1",placeholder:"72",value:p,onChange:t=>A(t.target.value),className:"nc-input"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(fe,{size:12}),"Height (cm)"]}),e.jsx("input",{type:"number",required:!0,min:"1",placeholder:"178",value:h,onChange:t=>P(t.target.value),className:"nc-input"})]})]}),s===2&&e.jsxs("div",{className:"nc-step-panel flex flex-col gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx($,{size:12}),"Fitness Goal"]}),e.jsxs("select",{required:!0,value:u,onChange:t=>G(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Muscle Gain",children:"Muscle Gain"}),e.jsx("option",{value:"Weight Loss",children:"Weight Loss"}),e.jsx("option",{value:"Endurance",children:"Endurance"}),e.jsx("option",{value:"Maintenance",children:"Maintenance"}),e.jsx("option",{value:"Other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(R,{size:12}),"Activity Level"]}),e.jsxs("select",{required:!0,value:g,onChange:t=>T(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Sedentary",children:"Sedentary"}),e.jsx("option",{value:"Lightly Active",children:"Lightly Active"}),e.jsx("option",{value:"Moderate",children:"Moderate"}),e.jsx("option",{value:"Very Active",children:"Very Active"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(F,{size:12}),"Diet Preference"]}),e.jsxs("select",{required:!0,value:f,onChange:t=>Y(t.target.value),className:"nc-select",children:[e.jsx("option",{value:"Standard",children:"Standard"}),e.jsx("option",{value:"Vegetarian",children:"Vegetarian"}),e.jsx("option",{value:"Vegan",children:"Vegan"}),e.jsx("option",{value:"Keto",children:"Keto"}),e.jsx("option",{value:"Paleo",children:"Paleo"}),e.jsx("option",{value:"Other",children:"Other"})]})]})]}),s===3&&e.jsxs("div",{className:"nc-step-panel flex flex-col gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(_,{size:12}),"Medical Conditions (Optional)"]}),e.jsx("textarea",{rows:3,placeholder:"List any existing medical conditions or allergies...",value:q,onChange:t=>L(t.target.value),className:"nc-textarea"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"nc-label",children:[e.jsx(de,{size:12}),"Additional Notes (Optional)"]}),e.jsx("textarea",{rows:3,placeholder:"Any additional details or questions for our trainers...",value:E,onChange:t=>W(t.target.value),className:"nc-textarea"})]})]}),e.jsxs("div",{className:"flex items-center justify-between mt-11",children:[s>0?e.jsxs("button",{type:"button",onClick:J,className:"nc-btn-ghost",children:[e.jsx(me,{size:14}),"Back"]}):e.jsx("span",{}),s<S.length-1?e.jsxs("button",{type:"button",onClick:Z,className:"nc-btn-primary",children:["Continue",e.jsx(I,{size:15})]}):e.jsxs("button",{type:"submit",disabled:k,className:"nc-btn-primary",children:[k?e.jsx(xe,{size:15,className:"animate-spin"}):e.jsx(ne,{size:15}),k?"Submitting…":"Submit Request"]})]})]}),e.jsxs("div",{className:"flex items-center justify-center gap-2 mt-10 pt-8 text-[10px] text-white/30 uppercase tracking-[0.2em] nc-condensed font-semibold",style:{borderTop:"1px solid rgba(245,242,234,0.06)"},children:[e.jsx(ie,{size:13,className:"text-[var(--emerald)]"}),"Reviewed personally by our certified trainers"]})]}),e.jsxs("div",{className:"flex items-center justify-center gap-2 mt-8 text-[11px] text-white/30",children:[e.jsx(le,{size:12,className:"text-[var(--gold)]"}),e.jsx("span",{className:"nc-condensed tracking-widest uppercase font-semibold",children:"Average response time: within 24 hours"})]})]})]})};export{Se as NutritionModal};
