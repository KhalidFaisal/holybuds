'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getEffectColorClass } from '@/lib/colors';

const AVAILABLE_EFFECTS = ['Sleep', 'Focus', 'Energy', 'Relax', 'Creative', 'Euphoric'];

export default function MoodWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/password')) {
    return null;
  }

  const handleSelect = (effect) => {
    router.push(`/menu?category=flowers&effect=${effect}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Vertical Tab & Popup Container */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-pc-dark/90 backdrop-blur-md border border-r-0 border-pc-border shadow-2xl py-6 px-2 flex flex-col items-center gap-3 text-pc-muted hover:text-white hover:border-pc-gold/50 hover:bg-pc-dark transition-all ${isOpen ? 'rounded-l-none' : 'rounded-l-xl'}`}
        >
          <span 
            className="font-black uppercase tracking-widest text-xs" 
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Shop by Mood
          </span>
        </button>

        {/* Floating Popup */}
        {isOpen && (
          <div className="absolute right-full mr-4 w-72 bg-pc-card border border-pc-border shadow-2xl rounded-2xl p-5 flex flex-col animate-in slide-in-from-right-4 zoom-in-95 fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">
                Shop by Mood
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-pc-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-pc-muted mb-6 text-xs">
              Select a desired effect to find the perfect flower strains for your current vibe.
            </p>

            <div className="flex flex-col gap-2">
              {AVAILABLE_EFFECTS.map(effect => {
                const colors = getEffectColorClass(effect);
                return (
                  <button
                    key={effect}
                    onClick={() => handleSelect(effect)}
                    className={`w-full py-3 px-4 rounded-xl text-center font-black tracking-[0.15em] uppercase text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${colors}`}
                  >
                    {effect}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
