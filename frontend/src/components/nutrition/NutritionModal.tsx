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
 * Same fields, validation, and submission logic as the original modal —
 * reshaped into a cinematic, staged intake designed to feel like a
 * private consultancy rather than a form.
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

  const progressPct = ((stage + 1) / STAGES.length) * 100;

  return (
    <div className="nc-root">
      <style>{`
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
      `}</style>

      <div className="nc-grain" />

      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-28 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 30% 0%, rgba(16,185,129,0.10) 0%, transparent 55%), linear-gradient(180deg, #050706 0%, #071310 55%, #050706 100%)',
        }}
      >
        <div className="nc-orb-a" />
        <div className="nc-orb-b" />

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-8 right-8 sm:top-10 sm:right-12 text-[11px] tracking-[0.25em] uppercase text-white/35 hover:text-white/80 transition-colors z-10 nc-condensed font-semibold cursor-pointer"
          >
            ← Back
          </button>
        )}

        <div className="relative z-[1] max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
          <div className="nc-fade-in">
            <div className="flex items-center gap-3 mb-7">
              <span className="nc-eyebrow">Private Nutrition Consultancy</span>
            </div>

            <h1
              className="nc-serif text-white leading-[1.04] mb-7"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)', fontWeight: 500 }}
            >
              Precision nutrition,
              <br />
              <span style={{ fontStyle: 'italic', color: 'var(--emerald)' }}>personally</span> yours.
            </h1>

            <p
              className="text-white/55 mb-10 max-w-xl"
              style={{ fontSize: '16px', lineHeight: 1.8 }}
            >
              A guided intake with our certified trainers — no templates, no guesswork.
              Share your body, your goals and your lifestyle, and receive a supplement
              and nutrition advisory built around you alone.
            </p>

            <div className="flex flex-wrap items-center gap-5 mb-12">
              <button onClick={scrollToForm} className="nc-btn-primary">
                Begin Your Assessment
                <ArrowRight size={15} />
              </button>
              <div className="flex items-center gap-2 text-white/35 text-xs nc-condensed tracking-widest uppercase font-semibold">
                <Clock size={13} className="text-[var(--gold)]" />
                Response within 24 hours
              </div>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <div className="nc-stat">
                <div className="nc-serif text-white text-2xl" style={{ fontWeight: 500 }}>4</div>
                <div className="text-white/35 text-[10.5px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1">
                  Guided Stages
                </div>
              </div>
              <div className="nc-stat">
                <div className="nc-serif text-white text-2xl" style={{ fontWeight: 500 }}>1:1</div>
                <div className="text-white/35 text-[10.5px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1">
                  Certified Review
                </div>
              </div>
              <div className="nc-stat">
                <div className="nc-serif text-white text-2xl" style={{ fontWeight: 500 }}>100%</div>
                <div className="text-white/35 text-[10.5px] tracking-[0.2em] uppercase nc-condensed font-semibold mt-1">
                  Personalized
                </div>
              </div>
            </div>
          </div>

          {/* Signature visual: macro orbit rings */}
          <div className="relative hidden lg:flex items-center justify-center nc-fade-in" style={{ animationDelay: '0.2s' }}>
            <svg width="380" height="380" viewBox="0 0 380 380" className="nc-ring-orbit">
              <circle cx="190" cy="190" r="170" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="1" strokeDasharray="2 8" />
            </svg>
            <svg width="320" height="320" viewBox="0 0 320 320" className="absolute">
              <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(245,242,234,0.06)" strokeWidth="18" />
              <circle
                cx="160" cy="160" r="140" fill="none" stroke="#10B981" strokeWidth="18"
                strokeDasharray={`${2 * Math.PI * 140 * 0.62} ${2 * Math.PI * 140}`}
                strokeLinecap="round" transform="rotate(-90 160 160)" opacity="0.85"
              />
              <circle cx="160" cy="160" r="104" fill="none" stroke="rgba(245,242,234,0.06)" strokeWidth="16" />
              <circle
                cx="160" cy="160" r="104" fill="none" stroke="#C9A961" strokeWidth="16"
                strokeDasharray={`${2 * Math.PI * 104 * 0.44} ${2 * Math.PI * 104}`}
                strokeLinecap="round" transform="rotate(-90 160 160)" opacity="0.85"
              />
              <circle cx="160" cy="160" r="70" fill="none" stroke="rgba(245,242,234,0.06)" strokeWidth="14" />
              <circle
                cx="160" cy="160" r="70" fill="none" stroke="#5EEAD4" strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 70 * 0.3} ${2 * Math.PI * 70}`}
                strokeLinecap="round" transform="rotate(-90 160 160)" opacity="0.75"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <Leaf size={22} className="text-[var(--emerald)] mb-2" />
              <span className="nc-condensed text-white/40 text-[10px] tracking-[0.25em] uppercase font-semibold">
                Protein · Carbs · Fat
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ASSESSMENT ================= */}
      <section ref={formTopRef} className="relative px-6 sm:px-10 lg:px-20 py-24 sm:py-28">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="nc-eyebrow">The Assessment</span>
          <h2 className="nc-serif text-white mt-4" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', fontWeight: 500 }}>
            Four stages to your plan
          </h2>
          <div className="w-16 h-px mx-auto mt-6" style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
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
                      <Check size={15} color="#04120C" />
                    ) : (
                      <Icon size={15} color={isActive ? '#10B981' : 'rgba(245,242,234,0.35)'} />
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

          <div className="flex items-center justify-center gap-2 mt-10 pt-8 text-[10px] text-white/30 uppercase tracking-[0.2em] nc-condensed font-semibold"
            style={{ borderTop: '1px solid rgba(245,242,234,0.06)' }}
          >
            <ShieldCheck size={13} className="text-[var(--emerald)]" />
            Reviewed personally by our certified trainers
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-[11px] text-white/30">
          <Sparkles size={12} className="text-[var(--gold)]" />
          <span className="nc-condensed tracking-widest uppercase font-semibold">Average response time: within 24 hours</span>
        </div>
      </section>
    </div>
  );
};