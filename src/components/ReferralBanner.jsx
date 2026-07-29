'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralBanner() {
  const [driverName, setDriverName] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(null);
  const [visible, setVisible] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function checkReferral() {
      // Check URL first
      let code = searchParams.get('ref');
      let stored = false;

      if (!code) {
        code = localStorage.getItem('driver_referral_code');
        stored = true;
      }

      if (!code) return;

      try {
        const res = await fetch(`/api/referral?code=${code}`);
        if (res.ok) {
          const data = await res.json();
          setDriverName(data.driverName);
          setDiscountAmount(data.discountAmount);
          setVisible(true);

          if (!stored) {
            localStorage.setItem('driver_referral_code', code.toUpperCase());
          }
        } else {
          // If stored code is invalid, remove it
          if (stored) localStorage.removeItem('driver_referral_code');
        }
      } catch (err) {
        console.error('Error validating referral:', err);
      }
    }

    checkReferral();
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="bg-pc-green text-black text-center py-2 px-4 text-sm font-semibold tracking-wide">
      🎉 You've unlocked ${discountAmount?.toFixed(2)} off your first order from {driverName}!
      <button 
        onClick={() => setVisible(false)}
        className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
