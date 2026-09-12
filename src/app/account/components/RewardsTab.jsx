'use client';

import { useState } from 'react';
import { LOYALTY_REWARDS } from '@/lib/loyalty';

export default function RewardsTab({ customer, settings }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const points = customer?.points || 0;
  const storeCredit = customer?.storeCredit || 0;
  const referralCode = customer?.referralCode || '';
  const pointsPerDollar = settings?.pointsPerDollar || 1;

  // Build full referral link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.holybuds.net';
  const referralUrl = referralCode ? `${origin}/?ref=${referralCode}` : origin;
  const shareMessage = `Hey! Use my code ${referralCode} to get $10 off your first $100+ order at Holy Buds: ${referralUrl}`;

  // Next reward calculation
  const sortedRewards = [...LOYALTY_REWARDS].sort((a, b) => a.points - b.points);
  const nextReward = sortedRewards.find(r => r.points > points) || null;
  const nextPointsNeeded = nextReward ? nextReward.points - points : 0;
  const nextProgressPct = nextReward 
    ? Math.min(100, Math.round((points / nextReward.points) * 100))
    : 100;

  const handleCopyCode = async () => {
    if (navigator.clipboard && referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch {}
    }
  };

  const handleCopyLink = async () => {
    if (navigator.clipboard && referralUrl) {
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {}
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && referralCode) {
      try {
        await navigator.share({
          title: 'Holy Buds Referral',
          text: `Get $10 off your first order at Holy Buds with my code ${referralCode}!`,
          url: referralUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="space-y-8">
      {/* Top Banner: Points & Next Reward Stepper */}
      <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pc-card via-pc-card to-pc-green/10 border-pc-green/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pc-green">Loyalty Balance</span>
            <div className="text-4xl md:text-5xl font-black text-white mt-1">
              {points.toLocaleString()} <span className="text-xl text-pc-muted font-normal">pts</span>
            </div>
            <p className="text-xs text-pc-muted mt-1">
              Earn {pointsPerDollar} point{pointsPerDollar !== 1 ? 's' : ''} for every $1 spent at checkout.
            </p>
          </div>

          {storeCredit > 0 && (
            <div className="bg-pc-green/15 border border-pc-green/30 rounded-2xl p-4 text-right">
              <span className="text-xs font-semibold text-pc-muted uppercase tracking-wider">Available Store Credit</span>
              <p className="text-2xl md:text-3xl font-black text-pc-green">${storeCredit.toFixed(2)}</p>
              <p className="text-[11px] text-pc-muted mt-0.5">Automatically deducts at checkout!</p>
            </div>
          )}
        </div>

        {/* Progress to Next Reward */}
        {nextReward ? (
          <div className="bg-pc-dark/70 rounded-2xl p-4 border border-pc-border/80">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-white flex items-center gap-1.5">
                <span>🎯 Next Goal:</span>
                <span className="text-pc-green">{nextReward.label} ({nextReward.points} pts)</span>
              </span>
              <span className="text-pc-muted">{nextPointsNeeded} pts needed</span>
            </div>
            <div className="w-full bg-pc-smoke h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pc-green/80 to-pc-green h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${nextProgressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-pc-dark/70 rounded-2xl p-4 border border-pc-green/40 text-center text-xs font-bold text-pc-green">
            🏆 You have enough points to unlock our highest loyalty reward!
          </div>
        )}
      </div>

      {/* Referral Hub */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-2xl border border-amber-500/30">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-white">Give $10, Get $10</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Special Promo
                </span>
              </div>
              <p className="text-xs text-pc-muted leading-relaxed max-w-xl">
                Share your referral link with friends. When they place their first order of $100 or more, they get <strong className="text-white">$10 off</strong> and you receive <strong className="text-pc-green">$10 Store Credit</strong> added directly to your account!
              </p>
            </div>
          </div>
        </div>

        {/* Share Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Code Box */}
          <div className="bg-pc-dark/60 p-4 rounded-2xl border border-pc-border">
            <label className="block text-[11px] font-bold text-pc-muted uppercase tracking-wider mb-1.5">
              Your Referral Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralCode || 'GENERATING'}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white font-mono font-bold tracking-wider text-center"
              />
              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  copiedCode ? 'bg-pc-green text-pc-black font-black' : 'bg-pc-smoke hover:bg-pc-smoke/80 text-white'
                }`}
              >
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Link Box */}
          <div className="bg-pc-dark/60 p-4 rounded-2xl border border-pc-border">
            <label className="block text-[11px] font-bold text-pc-muted uppercase tracking-wider mb-1.5">
              Instant Referral Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white text-xs font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  copiedLink ? 'bg-pc-green text-pc-black font-black' : 'bg-pc-green text-pc-black font-bold hover:bg-pc-green/90'
                }`}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Social / Instant Share Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-pc-border/60">
          <span className="text-xs font-bold text-pc-muted mr-1">Share via:</span>
          
          <button
            onClick={handleNativeShare}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pc-dark hover:bg-pc-card text-white border border-pc-border transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            Share Menu Link
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
          >
            💬 WhatsApp
          </a>

          <a
            href={smsUrl}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1.5"
          >
            📱 Text / SMS
          </a>
        </div>

        {/* Referrals Made Activity History */}
        {customer?.referralsMade && customer.referralsMade.length > 0 && (
          <div className="mt-6 pt-6 border-t border-pc-border">
            <h4 className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-3">Recent Referrals Rewarded</h4>
            <div className="space-y-2">
              {customer.referralsMade.map(ref => (
                <div key={ref.id} className="flex justify-between items-center text-xs p-3 bg-pc-dark/40 rounded-xl border border-pc-border/40">
                  <span className="text-white font-medium">Friend completed first order</span>
                  <div className="text-right">
                    <span className="text-pc-green font-bold">+${ref.rewardCredit.toFixed(2)} Store Credit</span>
                    <span className="text-pc-muted block text-[10px]">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Loyalty Rewards Catalog */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-black text-white">Unlockable Rewards Catalog</h3>
          <p className="text-xs text-pc-muted mt-0.5">
            Eligible rewards are automatically available to select and deduct from your total at Checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRewards.map(reward => {
            const isUnlocked = points >= reward.points;

            return (
              <div
                key={reward.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-pc-card/90 border-pc-green/50 shadow-lg shadow-pc-green/5 hover:border-pc-green'
                    : 'bg-pc-dark/50 border-pc-border/60 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      isUnlocked
                        ? 'bg-pc-green text-pc-black shadow-sm'
                        : 'bg-pc-smoke text-pc-muted'
                    }`}
                  >
                    {reward.points.toLocaleString()} Pts
                  </span>

                  {isUnlocked ? (
                    <span className="text-xs font-bold text-pc-green flex items-center gap-1 bg-pc-green/10 border border-pc-green/30 px-2 py-0.5 rounded-md">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="text-[11px] text-pc-muted font-medium">
                      {reward.points - points} pts to go
                    </span>
                  )}
                </div>

                <h4 className={`text-base font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-pc-muted'}`}>
                  {reward.label}
                </h4>
                <p className="text-[11px] text-pc-muted">
                  {reward.type === 'FIXED' && `Deduct $${reward.value} instantly`}
                  {reward.type === 'PERCENT' && `Save ${reward.value}% on eligible items`}
                  {reward.type === 'FREE_LOWEST' && 'Complimentary item discount applied'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
