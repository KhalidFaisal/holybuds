'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const STORAGE_KEY = 'holybuds_age_verified';

export default function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [underageState, setUnderageState] = useState(false);

  useEffect(() => {
    try {
      const verified = localStorage.getItem(STORAGE_KEY);
      if (!verified) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(true);
      }
    } catch {
      // In case localStorage is blocked/unavailable
      setIsOpen(false);
    }
  }, []);

  const handleConfirm = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    setIsOpen(false);
  };

  const handleDeny = () => {
    setUnderageState(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-[#0d1411] border border-emerald-900/40 rounded-3xl shadow-2xl text-center text-white overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {!underageState ? (
          <>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="Holy Buds"
                width={180}
                height={50}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>

            {/* 21+ Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <span>21+ Verification Required</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 uppercase">
              Age Verification
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              You must be at least 21 years of age to access this website and purchase adult-use cannabis products in New York.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                I Am 21 or Older
              </button>

              <button
                type="button"
                onClick={handleDeny}
                className="w-full py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold text-xs tracking-wide transition-all border border-white/5 cursor-pointer"
              >
                I Am Under 21
              </button>
            </div>

            {/* Legal Notice */}
            <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
              Valid government-issued photo ID is required for all deliveries and pickups.
            </p>
          </>
        ) : (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400 font-black text-lg">
              21+
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Access Restricted
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              You must be at least 21 years old to view and order from Holy Buds.
            </p>
            <a
              href="https://www.google.com"
              className="inline-block py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              Exit Site
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
