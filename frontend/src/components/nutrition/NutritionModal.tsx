import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  Scale,
  Ruler,
  Target,
  Activity,
  Leaf,
  HeartPulse,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Send,
  Check,
  Sparkles,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { nutritionService } from '../../api/nutrition';
import { toast } from 'sonner';

interface NutritionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const STAGES = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'vitals', label: 'Vitals', icon: Activity },
  { id: 'objective', label: 'Objective', icon: Target },
  { id: 'wellbeing', label: 'Wellbeing', icon: HeartPulse },
] as const;

/**
 * Full-page "Nutrition Consultancy" experience.
 * Same fields, validation, and submission logic as before — restyled to
 * use the exact same fonts/colors/design language as Home.tsx (white
 * sections, 'Barlow Condensed' black uppercase headings, 'DM Sans' body/
 * labels, emerald #10B981 as the primary accent, the shared .text-gold
 * shimmer class for headline emphasis) instead of its own dark gold/
 * serif theme. Every border-radius value from the original is left
 * untouched — only color, font, and background treatment changed.
 */
export const NutritionModal: React.FC<NutritionModalProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;

  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [activityLevel, setActivityLevel] = useState('Moderate');
  const [dietPreference, setDietPreference] = useState('Vegetarian');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState(0);
  const formTopRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    } else {
      setName('');
      setEmail('');
    }
  }, [user]);

  const scrollToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateStage = (index: number) => {
    if (index === 0) {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        toast.error('Please share your name, email and phone number.');
        return false;
      }
    }
    if (index === 1) {
      if (!age.trim() || !gender.trim() || !weight.trim() || !height.trim()) {
        toast.error('Please complete your vitals to continue.');
        return false;
      }
    }
    if (index === 2) {
      if (!goal.trim() || !activityLevel.trim() || !dietPreference.trim()) {
        toast.error('Please tell us your objective to continue.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStage(stage)) return;
    setStage((s) => Math.min(s + 1, STAGES.length - 1));
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBack = () => {
    setStage((s) => Math.max(s - 1, 0));
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !age.trim() ||
      !gender.trim() ||
      !weight.trim() ||
      !height.trim() ||
      !goal.trim() ||
      !activityLevel.trim() ||
      !dietPreference.trim()
    ) {
      toast.error('Please fill in all the required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await nutritionService.submitRequest({
        name,
        phone,
        email,
        age: Number(age),
        gender,
        weight: Number(weight),
        height: Number(height),
        goal,
        activity_level: activityLevel,
        diet_preference: dietPreference,
        medical_conditions: medicalConditions,
        notes,
      });
      toast.success('Nutrition advice request submitted! Our trainers will review and send you an email.');
      setPhone('');
      setAge('');
      setWeight('');
      setHeight('');
      setMedicalConditions('');
      setNotes('');
      setStage(0);
      onClose?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800;900&display=swap');

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
      `}</style>

      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-28 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#ffffff 0%,#f7faf9 55%,#eefaf5 100%)' }}
      >
        <div className="nc-orb-a" />
        <div className="nc-orb-b" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-8 right-8 sm:top-10 sm:right-12 text-[11px] tracking-[0.25em] uppercase text-gray-400 hover:text-gray-800 transition-colors z-10 nc-condensed font-bold cursor-pointer"
          >
            ← Back
          </button>
        )}

        <div className="relative z-[1] max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
          <div className="nc-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 text-[9px] sm:text-[10px] font-bold tracking-[0.3em] sm:tracking-[0.35em] uppercase" style={{ border: '1px solid #10B981', color: '#10B981', background: 'rgba(16,185,129,0.10)', fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
              Private Nutrition Consultancy
            </div>

            <h1
              className="font-black leading-[0.95] text-gray-900 mb-7"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2.6rem, 6vw, 4.6rem)', letterSpacing: '-0.02em' }}
            >
              PRECISION NUTRITION,
              <br />
              <span className="text-gold">PERSONALLY</span> YOURS
            </h1>

            <p className="text-gray-600 mb-10 max-w-xl text-sm sm:text-[0.95rem] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              A guided intake with our certified trainers — no templates, no guesswork.
              Share your body, your goals and your lifestyle, and receive a supplement
              and nutrition advisory built around you alone.
            </p>

            <div className="flex flex-wrap items-center gap-5 mb-12">
              <button onClick={scrollToForm} className="nc-btn-primary">
                Begin Your Assessment
                <ArrowRight size={15} />
              </button>
              <div className="flex items-center gap-2 text-gray-400 text-xs nc-condensed tracking-widest uppercase font-bold">
                <Clock size={13} className="text-emerald-500" />
                Response within 24 hours
              </div>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <div className="nc-stat">
                <div className="font-black text-gray-900 text-lg sm:text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>4</div>
                <div className="text-gray-400 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1">
                  Guided Stages
                </div>
              </div>
              <div className="nc-stat">
                <div className="font-black text-gray-900 text-lg sm:text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>1:1</div>
                <div className="text-gray-400 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1">
                  Certified Review
                </div>
              </div>
              <div className="nc-stat">
                <div className="font-black text-gray-900 text-lg sm:text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>100%</div>
                <div className="text-gray-400 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1">
                  Personalized
                </div>
              </div>
            </div>
          </div>

          {/* Signature visual: macro orbit rings — same concentric circles
              as before (roundness untouched), recolored for a white backdrop. */}
          <div className="relative hidden lg:flex items-center justify-center nc-fade-in" style={{ animationDelay: '0.2s' }}>
            <svg width="380" height="380" viewBox="0 0 380 380" className="nc-ring-orbit">
              <circle cx="190" cy="190" r="170" fill="none" stroke="rgba(16,185,129,0.16)" strokeWidth="1" strokeDasharray="2 8" />
            </svg>
            <svg width="320" height="320" viewBox="0 0 320 320" className="absolute">
              <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="18" />
              <circle
                cx="160" cy="160" r="140" fill="none" stroke="#10B981" strokeWidth="18"
                strokeDasharray={`${2 * Math.PI * 140 * 0.62} ${2 * Math.PI * 140}`}
                strokeLinecap="round" transform="rotate(-90 160 160)" opacity="0.9"
              />
              <circle cx="160" cy="160" r="104" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="16" />
              <circle
                cx="160" cy="160" r="104" fill="none" stroke="#D4AF37" strokeWidth="16"
                strokeDasharray={`${2 * Math.PI * 104 * 0.44} ${2 * Math.PI * 104}`}
                strokeLinecap="round" transform="rotate(-90 160 160)" opacity="0.9"
              />
              <circle cx="160" cy="160" r="70" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" />
              <circle
                cx="160" cy="160" r="70" fill="none" stroke="#3b82f6" strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 70 * 0.3} ${2 * Math.PI * 70}`}
                strokeLinecap="round" transform="rotate(-90 160 160)" opacity="0.85"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <Leaf size={22} className="text-emerald-500 mb-2" />
              <span className="nc-condensed text-gray-400 text-[10px] tracking-[0.25em] uppercase font-bold">
                Protein · Carbs · Fat
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ASSESSMENT ================= */}
      <section ref={formTopRef} className="relative px-6 sm:px-10 lg:px-20 py-24 sm:py-28" style={{ background: '#E5F0EC' }}>
        <div className="max-w-3xl mx-auto mb-14">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.5))' }} />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.35em] sm:tracking-[0.45em] uppercase text-emerald-500 whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>The Assessment</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(16,185,129,0.5))' }} />
          </div>
          <h2 className="text-center font-black tracking-tight text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', lineHeight: 0.95 }}>
            FOUR STAGES TO <span className="text-gold">YOUR PLAN</span>
          </h2>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Precision-formulated advice. Zero guesswork.
          </p>
        </div>

        <div className="max-w-2xl mx-auto nc-card px-6 sm:px-10 py-10 sm:py-12">
          {/* Stage tracker */}
          <div className="nc-stage-track mb-12">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === stage;
              const isComplete = i < stage;
              return (
                <div key={s.id} className="nc-stage">
                  <div className={`nc-stage-dot ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                    {isComplete ? (
                      <Check size={15} color="#ffffff" />
                    ) : (
                      <Icon size={15} color={isActive ? '#10B981' : 'rgba(17,24,39,0.35)'} />
                    )}
                  </div>
                  <span className={`nc-stage-label ${isActive ? 'active' : ''}`}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Stage 0 — Identity */}
            {stage === 0 && (
              <div className="nc-step-panel flex flex-col gap-5">
                <div>
                  <label className="nc-label"><User size={12} />Full Name</label>
                  <input
                    type="text" required placeholder="Your name" value={name}
                    onChange={(e) => setName(e.target.value)} className="nc-input"
                  />
                </div>
                <div>
                  <label className="nc-label"><Mail size={12} />Email Address</label>
                  <input
                    type="email" required placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} className="nc-input"
                  />
                </div>
                <div>
                  <label className="nc-label"><Phone size={12} />Phone Number</label>
                  <input
                    type="tel" required placeholder="+44 123 456789" value={phone}
                    onChange={(e) => setPhone(e.target.value)} className="nc-input"
                  />
                </div>
              </div>
            )}

            {/* Stage 1 — Vitals */}
            {stage === 1 && (
              <div className="nc-step-panel grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="nc-label"><CalendarDays size={12} />Age</label>
                  <input
                    type="number" required min="1" placeholder="24" value={age}
                    onChange={(e) => setAge(e.target.value)} className="nc-input"
                  />
                </div>
                <div>
                  <label className="nc-label"><User size={12} />Gender</label>
                  <select required value={gender} onChange={(e) => setGender(e.target.value)} className="nc-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="nc-label"><Scale size={12} />Weight (kg)</label>
                  <input
                    type="number" required min="1" placeholder="72" value={weight}
                    onChange={(e) => setWeight(e.target.value)} className="nc-input"
                  />
                </div>
                <div>
                  <label className="nc-label"><Ruler size={12} />Height (cm)</label>
                  <input
                    type="number" required min="1" placeholder="178" value={height}
                    onChange={(e) => setHeight(e.target.value)} className="nc-input"
                  />
                </div>
              </div>
            )}

            {/* Stage 2 — Objective */}
            {stage === 2 && (
              <div className="nc-step-panel flex flex-col gap-5">
                <div>
                  <label className="nc-label"><Target size={12} />Fitness Goal</label>
                  <select required value={goal} onChange={(e) => setGoal(e.target.value)} className="nc-select">
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="nc-label"><Activity size={12} />Activity Level</label>
                  <select required value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="nc-select">
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly Active">Lightly Active</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Very Active">Very Active</option>
                  </select>
                </div>
                <div>
                  <label className="nc-label"><Leaf size={12} />Diet Preference</label>
                  <select required value={dietPreference} onChange={(e) => setDietPreference(e.target.value)} className="nc-select">
                    <option value="Standard">Standard</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Keto">Keto</option>
                    <option value="Paleo">Paleo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* Stage 3 — Wellbeing */}
            {stage === 3 && (
              <div className="nc-step-panel flex flex-col gap-5">
                <div>
                  <label className="nc-label"><HeartPulse size={12} />Medical Conditions (Optional)</label>
                  <textarea
                    rows={3} placeholder="List any existing medical conditions or allergies..."
                    value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} className="nc-textarea"
                  />
                </div>
                <div>
                  <label className="nc-label"><MessageSquare size={12} />Additional Notes (Optional)</label>
                  <textarea
                    rows={3} placeholder="Any additional details or questions for our trainers..."
                    value={notes} onChange={(e) => setNotes(e.target.value)} className="nc-textarea"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-11">
              {stage > 0 ? (
                <button type="button" onClick={handleBack} className="nc-btn-ghost">
                  <ArrowLeft size={14} />
                  Back
                </button>
              ) : <span />}

              {stage < STAGES.length - 1 ? (
                <button type="button" onClick={handleNext} className="nc-btn-primary">
                  Continue
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="nc-btn-primary">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-center gap-2 mt-10 pt-8 text-[10px] text-gray-400 uppercase tracking-[0.2em] nc-condensed font-semibold"
            style={{ borderTop: '1px solid var(--hair)' }}
          >
            <ShieldCheck size={13} className="text-emerald-500" />
            Reviewed personally by our certified trainers
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-[11px] text-gray-400">
          <Sparkles size={12} className="text-emerald-500" />
          <span className="nc-condensed tracking-widest uppercase font-semibold">Average response time: within 24 hours</span>
        </div>
      </section>
    </div>
  );
};