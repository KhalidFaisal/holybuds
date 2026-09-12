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
                <svg className="w-4 h-4 text-pc-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Next Goal:</span>
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
          <div className="bg-pc-dark/70 rounded-2xl p-4 border border-pc-green/40 text-center text-xs font-bold text-pc-green flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.496m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.496 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
            </svg>
            <span>You have enough points to unlock our highest loyalty reward!</span>
          </div>
        )}
      </div>

      {/* Referral Hub */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
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
            <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
            </svg>
            WhatsApp
          </a>

          <a
            href={smsUrl}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 49.188 49.188 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            Text / SMS
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
