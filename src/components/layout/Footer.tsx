import React, { useState } from 'react';
import { Send, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';
import { contactService } from '../../api/contact';
import { toast } from 'sonner';

import logoImage from '../../assets/logo.jpg';

interface FooterProps {
  onOpenNutrition: () => void;
  onNavigate: (page: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenNutrition, onNavigate }) => {
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
      className="relative pt-16 pb-8 px-6 md:px-14 lg:px-20 overflow-hidden"
      style={{
        background: '#040404',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Left Column: Store Details & Links */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <img
                src={logoImage}
                alt="Celti Core Logo"
                className="w-9 h-9 shrink-0 object-contain rounded-full border border-emerald-500/30"
                style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
              />
              <span className="text-xl font-black tracking-[0.2em] uppercase text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Celti Core</span>
            </div>
            
            <p className="text-white/40 text-sm leading-relaxed max-w-md mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Celti Core is a premium fitness brand engineered for high-performance athletes who demand absolute purity. Our supplements are clinically dosed, lab-tested, and free of artificial fillers.
            </p>
            
            {/* Quick Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs text-white/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-500" />
                <span>100 Core Way, London, UK</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-500" />
                <span>support@celticore.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-500" />
                <span>+44 (0) 20 7946 0958</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>ISO 9001 Certified Labs</span>
              </div>
            </div>
          </div>

          {/* Links Row */}
          <div className="flex flex-wrap gap-8 text-xs text-white/35 font-bold uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <button onClick={() => onNavigate('home')} className="hover:text-emerald-400 transition-colors cursor-pointer">Shop Home</button>
            <button onClick={onOpenNutrition} className="hover:text-emerald-400 transition-colors cursor-pointer">Free Consultation</button>
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
          </div>
        </div>

        {/* Right Column: Contact Message Form */}
        <div
          className="p-6 md:p-8 rounded border border-white/5 relative bg-[#090909]"
          style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
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
                  className="w-full px-4 py-2.5 text-white placeholder-white/20 outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606]"
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
                  className="w-full px-4 py-2.5 text-white placeholder-white/20 outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-white outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606]"
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
                className="w-full px-4 py-2.5 text-white placeholder-white/20 outline-none transition-all duration-200 border border-white/10 focus:border-emerald-500/60 bg-[#060606]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 py-3 mt-2 font-black tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <Send size={12} />
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-white/20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <span>© {new Date().getFullYear()} Celti Core Ltd. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white/40 transition-colors">Facebook</a>
          <a href="#" className="hover:text-white/40 transition-colors">Instagram</a>
          <a href="#" className="hover:text-white/40 transition-colors">X (Twitter)</a>
        </div>
      </div>
    </footer>
  );
};
