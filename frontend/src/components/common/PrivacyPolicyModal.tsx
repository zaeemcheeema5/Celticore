import React from 'react';
import { X } from 'lucide-react';

// The footer previously linked "Privacy Policy" to href="#" — a dead link.
// This modal gives that link somewhere real to go. It's a plain-language
// starting policy covering what CeltiCore actually collects and stores
// today (accounts, orders, contact messages, cookies) — it should be
// reviewed by counsel before being treated as a final legal document.

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded p-6 sm:p-8"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={18} />
        </button>

        <h2
          className="text-xl font-black uppercase tracking-widest text-white mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Privacy <span className="text-emerald-400">Policy</span>
        </h2>
        <p className="text-xs text-white/40 mb-6">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-5 text-sm text-white/70 leading-relaxed">
          <section>
            <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">What we collect</h3>
            <p>
              When you create an account, place an order, or send us a message, we collect the
              information you provide: your name, email address, delivery address, order details,
              and the content of any message you send through our contact form.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Why we collect it</h3>
            <p>
              We use this information to create and secure your account, process and fulfil your
              orders, respond to your enquiries, and meet our legal and accounting obligations. We
              do not sell your personal data.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Payments</h3>
            <p>
              Card payments are processed by Stripe. We do not see or store your full card number —
              Stripe handles that in line with PCI-DSS requirements.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Cookies</h3>
            <p>
              We use two cookies, both essential to the site working: one keeps you signed in
              (httpOnly, so it can't be read by scripts on the page), and one remembers a display
              preference. We do not use advertising or analytics cookies.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Your rights</h3>
            <p>
              You can ask us to access, correct, or delete your personal data at any time by
              emailing <span className="text-emerald-400">support@celticore.com</span>. We'll
              respond within 30 days.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-2">Contact</h3>
            <p>
              Celti Core, 100 Core Way, London, UK. support@celticore.com · +44 (0) 20 7946 0958
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};