import React, { useState } from 'react';
import { Send, MapPin, Mail, Phone, ShieldCheck, Instagram, Facebook, Twitter, Navigation, Clock, ArrowUpRight } from 'lucide-react';
import { contactService } from '../../api/contact';
import { toast } from 'sonner';

import logoImage from '../../assets/logo.webp';

interface FooterProps {
  onOpenNutrition: () => void;
  onNavigate: (page: any) => void;
  onOpenPrivacy: () => void;
}

// Real store location — Main Street, Mooncoin, Co. Waterford, X91 NX53, Ireland
const STORE_ADDRESS = "Main Street, Mooncoin, Co. Waterford, X91 NX53, Ireland";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(STORE_ADDRESS)}&output=embed`;
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE_ADDRESS)}`;

const CONTACT_EMAILS = [
  { label: "General Enquiries", address: "info@thecelticore.com" },
  { label: "Customer Support", address: "support@thecelticore.com" },
  { label: "Sales & Wholesale", address: "sales@thecelticore.com" },
  { label: "Say Hello", address: "hello@thecelticore.com" },
];

const PHONE_DISPLAY = "083 483 2200";
const PHONE_TEL = "tel:+353834832200";

export const Footer: React.FC<FooterProps> = ({ onOpenNutrition, onNavigate, onOpenPrivacy }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill out all required fields.");
      return;
    }

    // Mirrors the server-side check in backend/middleware/validateContact.js
    // so people get instant feedback instead of a round-trip 400 error.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await contactService.sendMessage({ name, email, subject, message });
      toast.success("Contact message sent successfully!");
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || "Failed to send message. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      id="footer-contact"
      className="relative pt-14 sm:pt-20 pb-8 px-4 sm:px-6 md:px-14 lg:px-20 overflow-hidden"
      style={{
        background: '#040404',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient depth layer — faint grid + soft glow orbs, matching the
          rest of the site's floating-blob language, kept subtle so it
          reads as depth rather than distraction. */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="relative max-w-7xl mx-auto">

        {/* ============ Top Grid: Brand / Links / Contact ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-12 sm:mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <img
                src={logoImage}
                alt="Celti Core Logo"
                loading="lazy"
                decoding="async"
                className="w-9 h-9 shrink-0 object-contain rounded-full border border-emerald-500/30"
                style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
              />
              <span className="text-lg sm:text-xl font-black tracking-[0.2em] uppercase text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Celti Core</span>
            </div>

            <p className="text-white/40 text-sm leading-relaxed mb-7" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Celti Core is a premium fitness brand engineered for high-performance athletes who demand absolute purity. Our supplements are clinically dosed, lab-tested, and free of artificial fillers.
            </p>

            <div
              className="inline-flex items-center gap-2 text-[11px] text-emerald-400/90 font-bold uppercase tracking-widest px-3.5 py-2 rounded-lg w-fit mb-7 border border-emerald-500/15"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 20px -12px rgba(16,185,129,0.4)',
              }}
            >
              <ShieldCheck size={13} />
              ISO 9001 Certified Labs
            </div>

            {/* Socials — raised circular badges with a lift-on-hover "3D" feel */}
            <div className="flex items-center gap-3 mt-auto">
              {[
{ Icon: Instagram, href: 'https://www.instagram.com/celticoreproject?igsh=MWNsZjNhNHdyeTEzdQ==', label: 'Instagram' },
{ Icon: Facebook, href: 'https://www.facebook.com/share/1BUPkJjDTK/', label: 'Facebook' },
{ Icon: Twitter, href: 'https://x.com/Celti_Core', label: 'X (Twitter)' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group relative w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/50 transition-all duration-300 hover:-translate-y-1 hover:text-emerald-400 hover:border-emerald-500/30 cursor-pointer"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.005))',
                    boxShadow: '0 6px 16px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Quick Links
            </h4>
            <div className="flex flex-col gap-3.5 text-sm text-white/45 font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <button onClick={() => onNavigate('home')} className="group flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer w-fit text-left">
                Shop Home
                <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>
              <button onClick={onOpenNutrition} className="group flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer w-fit text-left">
                Free Consultation
                <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>
              <button onClick={() => onNavigate('track-order')} className="group flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer w-fit text-left">
                Track My Order
                <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>
              <button onClick={onOpenPrivacy} className="group flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer w-fit text-left">
                Privacy Policy
                <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>
              <a href="#" className="group flex items-center gap-1.5 hover:text-emerald-400 transition-colors w-fit">
                Terms of Service
                <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </a>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="lg:col-span-5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80 mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Get In Touch
            </h4>

            <div className="flex flex-col gap-3">
              {/* Phone */}
              <a
                href={PHONE_TEL}
                className="group flex items-center gap-3 p-3 rounded-xl border border-white/8 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/25 cursor-pointer"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
                  boxShadow: '0 8px 20px -14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/15"
                  style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.02))' }}
                >
                  <Phone size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/35" style={{ fontFamily: "'DM Sans', sans-serif" }}>Call Us</p>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>{PHONE_DISPLAY}</p>
                </div>
              </a>

              {/* Address */}
              <a
                href={MAP_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl border border-white/8 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/25 cursor-pointer"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
                  boxShadow: '0 8px 20px -14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/15"
                  style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.02))' }}
                >
                  <MapPin size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/35" style={{ fontFamily: "'DM Sans', sans-serif" }}>Visit Our Store</p>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Main Street, Mooncoin, X91 NX53, Waterford, Ireland
                  </p>
                </div>
              </a>

              {/* Emails grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTACT_EMAILS.map((e) => (
                  <a
                    key={e.address}
                    href={`mailto:${e.address}`}
                    className="group flex items-center gap-2.5 p-3 rounded-xl border border-white/8 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/25 cursor-pointer min-w-0"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
                      boxShadow: '0 8px 20px -14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <span
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/15"
                      style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.02))' }}
                    >
                      <Mail size={13} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-wider text-white/35 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{e.label}</p>
                      <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{e.address}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============ Map + Contact Form ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">

          {/* Real embedded map — exact store location */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/8 group"
            style={{ boxShadow: '0 20px 50px -25px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
              <h3 className="text-base font-black tracking-widest uppercase text-white flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <MapPin size={16} className="text-emerald-400" />
                Find Us Here
              </h3>
              <p className="text-[11px] text-white/60 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Main Street, Mooncoin, X91 NX53, Waterford, Ireland
              </p>
            </div>

            <iframe
              title="Celti Core store location"
              src={MAP_EMBED_SRC}
              className="w-full h-[320px] sm:h-[380px] lg:h-full grayscale-[35%] contrast-[1.05] opacity-90 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
              style={{ minHeight: 320, border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <a
              href={MAP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-500 text-black text-[11px] font-black uppercase tracking-wider hover:bg-emerald-400 transition-all cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", boxShadow: '0 10px 24px -8px rgba(16,185,129,0.6)' }}
            >
              <Navigation size={12} />
              Get Directions
            </a>
          </div>

          {/* Contact Message Form */}
          <div
            className="p-5 sm:p-6 md:p-8 rounded-2xl border border-white/8 relative bg-[#090909]"
            style={{ boxShadow: '0 20px 50px -25px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)' }}
          >
            <h3 className="text-lg font-black tracking-widest uppercase text-white mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Send Us A <span className="text-emerald-400">Message</span>
            </h3>
            <p className="text-xs text-white/40 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>Have any queries regarding our formulas? Feel free to contact our support team.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-2.5 text-white placeholder-white/20 outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 text-white placeholder-white/20 outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-white outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606] rounded-lg cursor-pointer"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Product Sourcing">Product Quality / Lab Reports</option>
                  <option value="Order Issue">Order Tracking / Deliveries</option>
                  <option value="Wholesale">Wholesale & Distribution</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Your Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full px-4 py-2.5 text-white placeholder-white/20 outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606] rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 py-3.5 mt-2 font-black tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-all disabled:opacity-50 cursor-pointer rounded-lg hover:-translate-y-0.5"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", boxShadow: '0 10px 24px -10px rgba(16,185,129,0.5)' }}
              >
                <Send size={12} />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* ============ Bottom Bar ============ */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-white/20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <span>© {new Date().getFullYear()} Celti Core Ltd. All rights reserved.</span>
          <div className="flex items-center gap-1.5 text-white/25">
            <Clock size={11} />
            <span>Mon - Fri: 9:00 AM - 6:00 PM GMT</span>
          </div>
        </div>
      </div>---
    </footer>
  );
};