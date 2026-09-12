'use client';

import { useState } from 'react';
import { LOYALTY_REWARDS, LOYALTY_TIERS, getTierInfo } from '@/lib/loyalty';
import { TierIcon } from './AccountHero';

export default function RewardsTab({ customer, settings }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const points = customer?.points || 0; // Spendable points
  const tierPoints = customer?.tierPoints ?? points; // Lifetime tier points
  const totalOrders = customer?.totalOrders || 0;
  const storeCredit = customer?.storeCredit || 0;
  const referralCode = customer?.referralCode || '';
  const pointsPerDollar = settings?.pointsPerDollar || 1;

  const currentTierInfo = getTierInfo(tierPoints, totalOrders);

  // Build full referral link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.holybuds.net';
  const referralUrl = referralCode ? `${origin}/?ref=${referralCode}` : origin;
  const shareMessage = `Hey! Use my code ${referralCode} to get $10 off your first $100+ order at Holy Buds: ${referralUrl}`;

  // Next reward calculation based on spendable points
  const sortedRewards = [...LOYALTY_REWARDS].sort((a, b) => a.points - b.points);

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
      {/* Top Banner: Spendable Points & VIP Tier Status */}
      <div className="glass-card p-6 md:p-8 bg-gradient-to-br from-pc-card via-pc-card to-pc-green/10 border-pc-green/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-pc-green">Spendable Points</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentTierInfo.badgeClass}`}>
                <TierIcon type={currentTierInfo.type} className="w-3 h-3" />
                <span>Tier {currentTierInfo.tier}: {currentTierInfo.name}</span>
              </span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-white mt-1">
              {points.toLocaleString()} <span className="text-xl text-pc-muted font-normal">pts</span>
            </div>
            <p className="text-xs text-pc-muted mt-1">
              Earn {pointsPerDollar} point{pointsPerDollar !== 1 ? 's' : ''} for every $1 spent. Redeemable at checkout!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {storeCredit > 0 && (
              <div className="bg-pc-green/15 border border-pc-green/30 rounded-2xl p-4 text-right">
                <span className="text-xs font-semibold text-pc-muted uppercase tracking-wider">Available Store Credit</span>
                <p className="text-2xl md:text-3xl font-black text-pc-green">${storeCredit.toFixed(2)}</p>
                <p className="text-[11px] text-pc-muted mt-0.5">Automatically deducts at checkout!</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress to Next VIP Tier */}
        {currentTierInfo.nextTier ? (
          <div className="bg-pc-dark/70 rounded-2xl p-4 border border-pc-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold mb-2 gap-1">
              <span className="text-white flex items-center gap-1.5">
                <TierIcon type={currentTierInfo.nextTier.type} className="w-4 h-4 shrink-0" />
                <span>Next Tier Goal:</span>
                <span className="text-pc-green">Tier {currentTierInfo.nextTier.tier} - {currentTierInfo.nextTier.name}</span>
                <span className="text-pc-muted font-normal">({currentTierInfo.nextTier.rewardLabel})</span>
              </span>
              <span className="text-pc-muted font-medium">
                {currentTierInfo.pointsNeeded > 0 && `${currentTierInfo.pointsNeeded.toLocaleString()} pts`}
                {currentTierInfo.pointsNeeded > 0 && currentTierInfo.ordersNeeded > 0 && ' or '}
                {currentTierInfo.ordersNeeded > 0 && `${currentTierInfo.ordersNeeded} order${currentTierInfo.ordersNeeded > 1 ? 's' : ''}`} needed
              </span>
            </div>
            <div className="w-full bg-pc-smoke h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pc-green/80 to-pc-green h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${currentTierInfo.progressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] text-pc-muted">
              <span>Current Tier: <strong>{currentTierInfo.name}</strong></span>
              <span className="text-[10px] text-pc-muted/80">VIP Tier is permanent and never decreases when using points</span>
            </div>
          </div>
        ) : (
          <div className="bg-pc-dark/70 rounded-2xl p-4 border border-purple-500/40 text-center text-xs font-bold text-purple-300 flex items-center justify-center gap-2">
            <TierIcon type="diamond" className="w-5 h-5 text-purple-400 shrink-0" />
            <span>You have unlocked Tier 8: Diamond VIP &mdash; our highest loyalty milestone!</span>
          </div>
        )}
      </div>

      {/* 8-Tier VIP Roadmap */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>VIP Loyalty Tiers & Milestones</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pc-smoke text-pc-muted border border-pc-border">
              8 Tiers
            </span>
          </h3>
          <p className="text-xs text-pc-muted mt-0.5">
            Advance your tier through points earned or orders completed. Tiers are permanently unlocked and will never decrease when points are spent!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {LOYALTY_TIERS.map(t => {
            const isCurrent = t.tier === currentTierInfo.tier;
            const isUnlocked = t.tier <= currentTierInfo.tier;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition-all relative ${
                  isCurrent
                    ? 'bg-pc-card border-pc-green ring-1 ring-pc-green/40 shadow-lg shadow-pc-green/10'
                    : isUnlocked
                    ? 'bg-pc-card/70 border-pc-border/80'
                    : 'bg-pc-dark/40 border-pc-border/40 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-pc-dark border border-pc-border/60">
                      <TierIcon type={t.type} className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-pc-muted uppercase tracking-wider block">
                        Tier {t.tier}
                      </span>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {t.name}
                      </h4>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-bold bg-pc-green text-pc-black px-2 py-0.5 rounded-full shadow-sm">
                      Current
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-[10px] font-bold text-pc-green bg-pc-green/10 border border-pc-green/30 px-1.5 py-0.5 rounded-md">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-pc-muted bg-pc-smoke px-1.5 py-0.5 rounded-md">
                      Locked
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-pc-border/40 text-xs">
                  <div className="text-[11px] text-pc-muted mb-1">
                    {t.tier === 1 ? (
                      <span>Welcome Tier</span>
                    ) : (
                      <span>
                        <strong className="text-white">{t.points.toLocaleString()} pts</strong> or <strong className="text-white">{t.minOrders} orders</strong>
                      </span>
                    )}
                  </div>
                  <div className="text-pc-green font-semibold text-[11px] leading-snug">
                    {t.rewardLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                value={referralCode || 'Generating...'}
                className="bg-pc-black border border-pc-border/80 rounded-xl px-3 py-2 text-white font-mono text-sm flex-1 outline-none font-bold"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2 bg-pc-smoke hover:bg-pc-border border border-pc-border text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
              >
                {copiedCode ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Link Box */}
          <div className="bg-pc-dark/60 p-4 rounded-2xl border border-pc-border">
            <label className="block text-[11px] font-bold text-pc-muted uppercase tracking-wider mb-1.5">
              Your Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="bg-pc-black border border-pc-border/80 rounded-xl px-3 py-2 text-pc-muted text-xs flex-1 outline-none truncate font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-pc-green hover:bg-pc-green-dark text-pc-black font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="flex flex-wrap gap-2.5 mt-4 pt-2">
          <button
            type="button"
            onClick={handleNativeShare}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pc-smoke hover:bg-pc-border text-white border border-pc-border transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
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
            Eligible rewards are automatically available to select and deduct from your total at Checkout using your spendable points.
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
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-pc-green text-pc-black shadow-sm'
                          : 'bg-pc-smoke text-pc-muted'
                      }`}
                    >
                      {reward.points.toLocaleString()} Pts
                    </span>
                    {reward.tierName && (
                      <span className="text-[10px] font-bold text-pc-muted bg-pc-dark px-2 py-0.5 rounded-md border border-pc-border/50">
                        Tier {reward.tierNumber}
                      </span>
                    )}
                  </div>

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
