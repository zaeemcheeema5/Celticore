import React, { useState } from 'react';
import { X, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios'; // Ensure axios or your custom API instance is used here

import logoImage from '../../assets/logo.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sub-states specifically for the password recovery flow
type ForgotPasswordStep = 'request_email' | 'enter_otp' | 'new_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { login, signup } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<ForgotPasswordStep>('request_email');
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (authMode === 'signup' && !name)) {
      toast.error("Please fill in all the required fields.");
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await login({ email, password });
        toast.success("Successfully logged in!");
      } else {
        await signup({ name, email, password });
        toast.success("Account registered and logged in!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Request OTP Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      if (response.data.success) {
        toast.success(response.data.message);
        setForgotStep('enter_otp');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
 // STEP 2: Verify OTP
const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!otp) {
    toast.error("Please enter the OTP code.");
    return;
  }

  setLoading(true);
  try {
    // UPDATED: Added full backend URL
    const response = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
    if (response.data.success) {
      toast.success(response.data.message);
      setForgotStep('new_password');
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || err.response?.data?.error || "Invalid or expired OTP.");
  } finally {
    setLoading(false);
  }
};

// STEP 3: Submit New Password
const handleResetPasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!password) {
    toast.error("Please enter your new password.");
    return;
  }

  setLoading(true);
  try {
    // UPDATED: Added full backend URL
    const response = await axios.post('http://localhost:5000/api/auth/reset-password', { email, otp, password });
    if (response.data.success) {
      toast.success(response.data.message);
      setAuthMode('login');
      setForgotStep('request_email');
      setOtp('');
      setPassword('');
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to reset password.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-enter relative w-full max-w-[420px] my-6 sm:my-0"
        style={{
          background: "linear-gradient(150deg, #090e0b 0%, #080808 60%, #060b08 100%)",
          border: "1px solid rgba(16,185,129,0.25)",
          boxShadow: "0 0 70px rgba(16,185,129,0.12), 0 0 140px rgba(16,185,129,0.05)"
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent 0%, #10B981 30%, #D4AF37 70%, transparent 100%)" }} />
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/30 hover:text-white/80 transition-colors z-10 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="px-5 sm:px-8 pt-7 sm:pt-8 pb-7 sm:pb-8">
          <div className="flex items-center gap-3 mb-7">
            <img
              src={logoImage}
              alt="Celti Core Logo"
              className="w-10 h-10 shrink-0 object-contain rounded-full border border-emerald-500/30"
              style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
            />
            <div>
              <h2 className="text-[1.35rem] font-black tracking-[0.08em] uppercase leading-none text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {authMode === "login" && "Welcome Back"}
                {authMode === "signup" && "Join Celti Core"}
                {authMode === "forgot" && "Reset Password"}
              </h2>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {authMode === "login" && "Sign in to your account"}
                {authMode === "signup" && "Create your free account today"}
                {authMode === "forgot" && forgotStep === "request_email" && "Enter your email to receive a recovery link"}
                {authMode === "forgot" && forgotStep === "enter_otp" && "Check your email for the 6-digit verification code"}
                {authMode === "forgot" && forgotStep === "new_password" && "Create a secure new password for your account"}
              </p>
            </div>
          </div>

          {/* Login/Signup Tabs */}
          {authMode !== 'forgot' && (
            <div className="flex mb-6" style={{ border: "1px solid rgba(16,185,129,0.18)" }}>
              {(["login", "signup"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAuthMode(m)}
                  className="flex-1 py-2.5 text-[10px] font-black tracking-[0.22em] uppercase transition-all duration-250 cursor-pointer"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    background: authMode === m ? "#10B981" : "transparent",
                    color: authMode === m ? "#000" : "rgba(255,255,255,0.35)"
                  }}
                >
                  {m === "login" ? "Login" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Base Form Layouts */}
          {authMode !== 'forgot' ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              {authMode === "signup" && (
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                    style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", fontFamily: "'DM Sans', sans-serif" }}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)"}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                  style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)"}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                    style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", fontFamily: "'DM Sans', sans-serif" }}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {authMode === "login" && (
                <div className="text-right -mt-1">
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setForgotStep('request_email'); }}
                    className="text-[11px] text-emerald-500/60 hover:text-emerald-400 transition-colors cursor-pointer" 
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-1 font-black text-[11px] tracking-[0.25em] uppercase transition-all duration-300 hover:scale-[1.015] emerald-btn-glow cursor-pointer"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#000"
                }}
              >
                {loading ? 'Processing...' : authMode === "login" ? "Sign In" : "Create Account"}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <span className="text-[11px] text-white/25" style={{ fontFamily: "'DM Sans', sans-serif" }}>or continue with</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              <div className="flex gap-3">
                {["Google", "Apple"].map(p => (
                  <button
                    type="button"
                    key={p}
                    className="flex-1 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 hover:text-white/70 transition-all duration-200 cursor-pointer"
                    style={{ border: "1px solid rgba(255,255,255,0.09)", fontFamily: "'Barlow Condensed', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <p className="text-center text-[11px] text-white/30 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {authMode === "login" ? "New to Celti Core?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold cursor-pointer"
                >
                  {authMode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
            </form>
          ) : (
            /* MULTI-STEP FORGOT PASSWORD FLOW */
            <div>
              {/* Step 1: Request OTP Form */}
              {forgotStep === 'request_email' && (
                <form onSubmit={handleRequestOtp} className="flex flex-col gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                      style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", fontFamily: "'DM Sans', sans-serif" }}
                      onFocus={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)"}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-1 font-black text-[11px] tracking-[0.25em] uppercase transition-all duration-300 hover:scale-[1.015] emerald-btn-glow cursor-pointer"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      color: "#000"
                    }}
                  >
                    {loading ? 'Sending...' : "Send Verification Code"}
                  </button>
                </form>
              )}

              {/* Step 2: Input & Verify OTP Code Form */}
              {forgotStep === 'enter_otp' && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Verification Code (OTP)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] font-bold text-white placeholder-white/20 outline-none transition-all duration-200"
                      style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", fontFamily: "'DM Sans', sans-serif" }}
                      onFocus={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)"}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-1 font-black text-[11px] tracking-[0.25em] uppercase transition-all duration-300 hover:scale-[1.015] emerald-btn-glow cursor-pointer"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      color: "#000"
                    }}
                  >
                    {loading ? 'Verifying...' : "Verify Code"}
                  </button>
                </form>
              )}

              {/* Step 3: Enter New Password Form */}
              {forgotStep === 'new_password' && (
                <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.25em] uppercase text-white/45 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all duration-200"
                        style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", fontFamily: "'DM Sans', sans-serif" }}
                        onFocus={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"}
                        onBlur={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-1 font-black text-[11px] tracking-[0.25em] uppercase transition-all duration-300 hover:scale-[1.015] emerald-btn-glow cursor-pointer"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      color: "#000"
                    }}
                  >
                    {loading ? 'Saving...' : "Reset Password"}
                  </button>
                </form>
              )}

              {/* Back to Login Options */}
              <button
                type="button"
                onClick={() => {
                  if (forgotStep === 'enter_otp') setForgotStep('request_email');
                  else { setAuthMode('login'); setForgotStep('request_email'); }
                }}
                className="flex items-center justify-center gap-2 mx-auto mt-4 text-[11px] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <ArrowLeft size={12} />
                {forgotStep === 'enter_otp' ? "Back to Email Entry" : "Back to Login"}
              </button>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(16,185,129,0.4), transparent)" }} />
      </div>
    </div>
  );
};