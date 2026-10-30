'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function StoreHoursBadge({ status }) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!status) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        onMouseEnter={() => setShowPopover(true)}
        className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-pc-card/90 border border-pc-green/40 hover:border-pc-green text-xs font-semibold text-white transition-all shadow-xs cursor-pointer"
        title="Holy Buds Delivery Hours"
        aria-label="Holy Buds Delivery Hours"
      >
        <span className="text-pc-green font-bold text-[10px] sm:text-xs tracking-tight sm:tracking-normal whitespace-nowrap">
          {status.isWeekend ? 'Open till 12 AM' : 'Open till 10 PM'}
        </span>
      </button>

      {/* Backdrop for mobile centering */}
      {showPopover && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
          onClick={() => setShowPopover(false)}
        />
      )}

      {/* Schedule Popover: Centered on mobile, aligned to right on desktop */}
      {showPopover && (
        <div
          onMouseLeave={() => setShowPopover(false)}
          className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100vw-2.5rem)] max-w-[330px] sm:max-w-none sm:translate-x-0 sm:left-auto sm:right-0 sm:absolute sm:top-full mt-2 sm:w-72 bg-pc-dark border border-pc-border rounded-2xl shadow-2xl p-3.5 sm:p-4 z-50 animate-scale-in text-left text-xs"
        >
          <div className="flex items-center justify-between border-b border-pc-border/60 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm tracking-tight sm:tracking-normal">
              <svg className="w-4 h-4 text-pc-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Delivery &amp; Pickup Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-pc-green text-black">
                {status.isOpen ? 'Open Now' : 'Closed'}
              </span>
              <button
                type="button"
                onClick={() => setShowPopover(false)}
                className="text-pc-muted hover:text-white sm:hidden p-1 rounded-md transition-colors"
                aria-label="Close hours modal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 ${status.isWeekend ? 'bg-pc-green/10 border border-pc-green/30' : 'bg-white/5 border border-pc-border/40'}`}>
              <div className="flex flex-col">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight sm:tracking-normal">Fri – Sat</span>
                <span className="text-[10.5px] sm:text-[11px] text-pc-green font-medium tracking-tight sm:tracking-normal">Weekend • Open Late</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {status.isWeekend && (
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-extrabold uppercase bg-pc-green/20 text-pc-green border border-pc-green/30">
                    Today
                  </span>
                )}
                <span className="font-mono font-bold text-pc-green text-xs sm:text-sm tracking-tight sm:tracking-normal">10 AM – 12 AM</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 ${!status.isWeekend ? 'bg-pc-green/10 border border-pc-green/30' : 'bg-white/5 border border-pc-border/40'}`}>
              <div className="flex flex-col">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight sm:tracking-normal">Sun – Thu</span>
                <span className="text-[10.5px] sm:text-[11px] text-pc-muted tracking-tight sm:tracking-normal">Standard Hours</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {!status.isWeekend && (
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-extrabold uppercase bg-pc-green/20 text-pc-green border border-pc-green/30">
                    Today
                  </span>
                )}
                <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-tight sm:tracking-normal">10 AM – 10 PM</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-pc-border/40 text-[10.5px] sm:text-[11px] text-pc-muted flex items-center justify-between">
            <span>Long Island, NY</span>
            <Link href="/faq" onClick={() => setShowPopover(false)} className="text-pc-green font-semibold hover:underline">
              View FAQ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
