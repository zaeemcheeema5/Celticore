import React, { useEffect, useState } from 'react';

// Previously the site set cookies (the auth session cookie and a UI
// preference cookie) with no notice to the visitor at all — no banner, no
// link to a policy. Both cookies are "essential/functional" under
// GDPR/PECR, which means opt-in consent isn't legally required, but a
// disclosure is still expected best practice. This banner provides that
// disclosure; it doesn't gate anything on acceptance since no non-essential
// (marketing/analytics) cookies are set.

const STORAGE_KEY = 'celticore_cookie_notice_ack';

interface CookieConsentProps {
  onOpenPrivacy: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onOpenPrivacy }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const ack = window.localStorage.getItem(STORAGE_KEY);
      if (!ack) setVisible(true);
    } catch {
      // If localStorage is unavailable (privacy mode, etc), just show it
      // once per session rather than crash.
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* no-op */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-[100] px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-between border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
        We use essential cookies to keep you signed in and remember your preferences. We don't use
        marketing or tracking cookies.{' '}
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="underline text-emerald-400 hover:text-emerald-300"
        >
          Read our Privacy Policy
        </button>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 px-5 py-2 text-xs font-bold uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 transition-colors rounded"
      >
        Got it
      </button>
    </div>
  );
};