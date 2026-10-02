'use client';

import Link from 'next/link';
import { getTierInfo } from '@/lib/loyalty';
import { TierIcon } from './AccountHero';

export default function RewardsMaintenanceView({ customer, onGoToOrders }) {
  const points = customer?.points || 0;
  const storeCredit = customer?.storeCredit || 0;
  const totalOrders = customer?.totalOrders || 0;
  const tierPoints = customer?.tierPoints ?? points;
  const tier = getTierInfo(tierPoints, totalOrders);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Maintenance Card */}
      <div className="glass-card p-6 md:p-10 border border-amber-500/30 bg-gradient-to-br from-pc-card via-amber-950/20 to-pc-card relative overflow-hidden text-center rounded-3xl shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-pc-green/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Animated Icon Badge */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 backdrop-blur-md">
              <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.32l-3.27 3.27a1.5 1.5 0 0 1-2.122-2.122l3.27-3.27a4.5 4.5 0 0 0-6.32 4.486c.048.58.024 1.193-.14 1.743" />
              </svg>
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-md">
              Upgrading
            </span>
          </div>

          {/* Heading & Notice */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Scheduled Program Maintenance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Rewards & Loyalty Upgrades
          </h2>

          <p className="text-sm md:text-base text-pc-muted max-w-xl leading-relaxed mb-8">
            We are currently optimizing the HolyBuds rewards and referral dashboard with enhanced tier perks and seamless one-click checkout discounts.
          </p>

          {/* Customer Preserved Metrics Card */}
          <div className="w-full bg-pc-black/60 border border-pc-border/80 rounded-2xl p-5 mb-8 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wider text-pc-muted mb-4 text-center">
              Your Account Balances Are Safe & Active
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-pc-card/40 rounded-xl border border-pc-border/50">
                <span className="text-[11px] text-pc-muted block uppercase font-medium">Your Points</span>
                <span className="text-xl sm:text-2xl font-black text-pc-green">{points.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-pc-card/40 rounded-xl border border-pc-border/50">
                <span className="text-[11px] text-pc-muted block uppercase font-medium">Store Credit</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">${storeCredit.toFixed(2)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 bg-pc-card/40 rounded-xl border border-pc-border/50 flex flex-col items-center justify-center">
                <span className="text-[11px] text-pc-muted block uppercase font-medium mb-1">VIP Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tier.badgeClass}`}>
                  <TierIcon type={tier.type} className="w-3 h-3" />
                  <span>{tier.name}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Key Assurance Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full mb-8">
            <div className="bg-pc-dark/60 border border-pc-border/60 rounded-xl p-4">
              <div className="text-pc-green font-bold text-sm flex items-center gap-2 mb-1">
                <span>🛡️</span> Points Never Expire
              </div>
              <p className="text-xs text-pc-muted leading-relaxed">
                All previous points and earned referral credits remain safely recorded on your profile.
              </p>
            </div>

            <div className="bg-pc-dark/60 border border-pc-border/60 rounded-xl p-4">
              <div className="text-amber-400 font-bold text-sm flex items-center gap-2 mb-1">
                <span>⚡</span> Orders Still Accumulate
              </div>
              <p className="text-xs text-pc-muted leading-relaxed">
                Every new order you place during maintenance still earns qualifying loyalty points.
              </p>
            </div>

            <div className="bg-pc-dark/60 border border-pc-border/60 rounded-xl p-4">
              <div className="text-purple-400 font-bold text-sm flex items-center gap-2 mb-1">
                <span>✨</span> New Perks Coming
              </div>
              <p className="text-xs text-pc-muted leading-relaxed">
                Expect upgraded VIP gifts, faster redemption, and expanded referral rewards soon.
              </p>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {onGoToOrders && (
              <button
                type="button"
                onClick={onGoToOrders}
                className="btn-primary px-6 py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pc-green/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
                View Your Order History
              </button>
            )}
            <Link
              href="/"
              className="btn-secondary px-6 py-3 font-bold text-sm flex items-center justify-center gap-2 text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
