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
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-pc-card/90 border border-pc-green/40 hover:border-pc-green text-xs font-semibold text-white transition-all shadow-xs group cursor-pointer"
        title="Holy Buds Delivery Hours"
        aria-label="Holy Buds Delivery Hours"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pc-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-pc-green"></span>
        </span>
        <span className="text-pc-green font-bold text-[11px] sm:text-xs whitespace-nowrap">
          {status.isWeekend ? 'Open till 12 AM' : 'Open till 10 PM'}
        </span>
        <svg
          className="w-3 h-3 text-pc-muted group-hover:text-white transition-transform duration-200 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Schedule Popover - always aligned to right to prevent any clipping */}
      {showPopover && (
        <div
          onMouseLeave={() => setShowPopover(false)}
          className="absolute right-0 mt-2 w-64 bg-pc-dark border border-pc-border rounded-xl shadow-2xl p-3.5 z-50 animate-scale-in text-left text-xs"
        >
          <div className="flex items-center justify-between border-b border-pc-border/60 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <svg className="w-3.5 h-3.5 text-pc-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Delivery & Pickup Hours</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-pc-green text-black">
              {status.isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>

          <div className="space-y-2">
            <div className={`p-2 rounded-lg flex items-center justify-between ${status.isWeekend ? 'bg-pc-green/10 border border-pc-green/30' : 'bg-white/5'}`}>
              <div className="flex flex-col">
                <span className="font-bold text-white flex items-center gap-1">
                  Fri – Sat (Weekend)
                  {status.isWeekend && <span className="text-[10px] text-pc-green font-extrabold">(Today)</span>}
                </span>
                <span className="text-[11px] text-pc-muted">Open Late</span>
              </div>
              <span className="font-mono font-bold text-pc-green">10 AM – 12 AM</span>
            </div>

            <div className={`p-2 rounded-lg flex items-center justify-between ${!status.isWeekend ? 'bg-pc-green/10 border border-pc-green/30' : 'bg-white/5'}`}>
              <div className="flex flex-col">
                <span className="font-bold text-white flex items-center gap-1">
                  Sun – Thu
                  {!status.isWeekend && <span className="text-[10px] text-pc-green font-extrabold">(Today)</span>}
                </span>
                <span className="text-[11px] text-pc-muted">Standard Hours</span>
              </div>
              <span className="font-mono font-bold text-white">10 AM – 10 PM</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-pc-border/40 text-[10px] text-pc-muted flex items-center justify-between">
            <span>Long Island, NY</span>
            <Link href="/faq" className="text-pc-green hover:underline">
              View FAQ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
