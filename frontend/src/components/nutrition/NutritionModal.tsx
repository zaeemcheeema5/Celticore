import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, Sparkles, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { nutritionService } from '../../api/nutrition';
import { toast } from 'sonner';

interface NutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({ isOpen, onClose }) => {
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

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    } else {
      setName('');
      setEmail('');
    }
  }, [user]);

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
      toast.error("Please fill in all the required fields.");
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
        notes
      });
      toast.success("Nutrition advice request submitted! Our trainers will review and send you an email.");
      setPhone('');
      setAge('');
      setWeight('');
      setHeight('');
      setMedicalConditions('');
      setNotes('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal Container */}
      <div
        className="modal-enter relative w-full max-w-[600px] bg-[#090e0b] border border-[#10B981]/30 rounded-lg p-5 sm:p-6 md:p-8 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto"
        style={{
          background: "linear-gradient(150deg, #090e0b 0%, #080808 60%, #060b08 100%)",
          boxShadow: "0 0 70px rgba(16,185,129,0.12), 0 0 140px rgba(16,185,129,0.05)"
        }}
      >
        {/* Top Gradient Accents */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#10B981] to-[#D4AF37]" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/30 hover:text-white/80 transition-colors z-10 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h2 className="text-[1.35rem] font-black tracking-widest uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Custom Nutrition Plan
            </h2>
            <p className="text-[11px] text-white/35 mt-1 leading-normal" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Get a tailored supplement advisory plan from our certified experts.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Phone Number
              </label>
              <input
                type="tel"
                required
                placeholder="+44 123 456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Age
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="24"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Gender
              </label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 text-white bg-[#090e0b] outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              >
                <option value="Male" className="bg-[#090e0b] text-white">Male</option>
                <option value="Female" className="bg-[#090e0b] text-white">Female</option>
                <option value="Other" className="bg-[#090e0b] text-white">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Diet Preference
              </label>
              <select
                required
                value={dietPreference}
                onChange={(e) => setDietPreference(e.target.value)}
                className="w-full px-4 py-3 text-white bg-[#090e0b] outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              >
                <option value="Standard" className="bg-[#090e0b] text-white">Standard</option>
                <option value="Vegetarian" className="bg-[#090e0b] text-white">Vegetarian</option>
                <option value="Vegan" className="bg-[#090e0b] text-white">Vegan</option>
                <option value="Keto" className="bg-[#090e0b] text-white">Keto</option>
                <option value="Paleo" className="bg-[#090e0b] text-white">Paleo</option>
                <option value="Other" className="bg-[#090e0b] text-white">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Weight (kg)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="72"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Height (cm)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="178"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Fitness Goal
              </label>
              <select
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 text-white bg-[#090e0b] outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              >
                <option value="Muscle Gain" className="bg-[#090e0b] text-white">Muscle Gain</option>
                <option value="Weight Loss" className="bg-[#090e0b] text-white">Weight Loss</option>
                <option value="Endurance" className="bg-[#090e0b] text-white">Endurance</option>
                <option value="Maintenance" className="bg-[#090e0b] text-white">Maintenance</option>
                <option value="Other" className="bg-[#090e0b] text-white">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Activity Level
              </label>
              <select
                required
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-4 py-3 text-white bg-[#090e0b] outline-none transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.18)",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
                onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
              >
                <option value="Sedentary" className="bg-[#090e0b] text-white">Sedentary</option>
                <option value="Lightly Active" className="bg-[#090e0b] text-white">Lightly Active</option>
                <option value="Moderate" className="bg-[#090e0b] text-white">Moderate</option>
                <option value="Very Active" className="bg-[#090e0b] text-white">Very Active</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Medical Conditions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="List any existing medical conditions or allergies..."
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
              style={{
                background: "rgba(16,185,129,0.04)",
                border: "1px solid rgba(16,185,129,0.18)",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: "1.6"
              }}
              onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
              onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any additional details or questions for our trainers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200"
              style={{
                background: "rgba(16,185,129,0.04)",
                border: "1px solid rgba(16,185,129,0.18)",
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: "1.6"
              }}
              onFocus={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.6)"}
              onBlur={e => e.currentTarget.style.borderColor="rgba(16,185,129,0.18)"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 mt-2 font-black text-[11px] tracking-[0.25em] uppercase transition-all duration-300 hover:scale-[1.015] flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "#000",
              boxShadow: "0 0 15px rgba(16,185,129,0.3)"
            }}
          >
            <Send size={12} />
            {submitting ? 'Submitting Request...' : 'Submit Request'}
          </button>
        </form>

        <div className="flex items-center gap-2 mt-4 text-[9px] text-white/30 justify-center">
          <Sparkles size={11} className="text-amber-400" />
          <span>Average response time: Within 24 Hours</span>
        </div>
      </div>
    </div>
  );
};