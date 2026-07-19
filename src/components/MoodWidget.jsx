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
      {/* Floating Vertical Tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-pc-dark/90 backdrop-blur-md border border-r-0 border-pc-border shadow-2xl py-6 px-2 rounded-l-xl flex flex-col items-center gap-3 text-pc-muted hover:text-white hover:border-pc-gold/50 hover:bg-pc-dark transition-all group"
        >
          <svg className="w-5 h-5 text-pc-gold group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span 
            className="font-black uppercase tracking-widest text-xs" 
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Shop by Mood
          </span>
        </button>
      </div>

      {/* Slide-out Drawer */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" 
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-pc-card border-l border-pc-border shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Shop by Mood
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-pc-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-pc-muted mb-8 text-sm">
              Select a desired effect to find the perfect flower strains for your current vibe.
            </p>

            <div className="flex flex-col gap-3">
              {AVAILABLE_EFFECTS.map(effect => {
                const colors = getEffectColorClass(effect);
                // Modify the colors slightly to look better as large buttons
                // Instead of a tiny badge, it's a full-width block
                return (
                  <button
                    key={effect}
                    onClick={() => handleSelect(effect)}
                    className={`w-full py-5 px-6 rounded-xl text-center font-black tracking-[0.2em] uppercase text-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${colors}`}
                  >
                    {effect}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
