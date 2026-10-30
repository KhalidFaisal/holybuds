'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StoreHoursBanner({ status }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('store_hours_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('store_hours_banner_dismissed', 'true');
    } catch {
      // Storage unavailable
    }
  };

  // Dynamic Smart Mode but ONLY on Weekends:
  if (!status || !status.isWeekend || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-pc-dark via-emerald-950/90 to-pc-dark border-b border-pc-green/40 text-white shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left: Schedule & Tag */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pc-gold text-black shrink-0">
            Weekend Hours
          </span>
          <span className="font-extrabold text-white flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-pc-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>It&apos;s The Weekend — Open Late Tonight Until 12 AM!</span>
          </span>
          <span className="hidden md:inline text-pc-muted text-xs">
            (Fri–Sat: 10 AM – 12 AM | Sun–Thu: 10 AM – 10 PM)
          </span>
        </div>

        {/* Right: CTA & Dismiss */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/menu"
            className="px-3 py-1 rounded-lg bg-pc-green hover:bg-pc-green-dark text-black font-extrabold text-xs transition-all active:scale-95 shadow-xs"
          >
            Shop Now
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss hours announcement"
            className="text-pc-muted hover:text-white p-1 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
