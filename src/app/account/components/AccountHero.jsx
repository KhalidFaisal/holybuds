'use client';

import { getTierInfo } from '@/lib/loyalty';

export function TierIcon({ type, className = 'w-3.5 h-3.5' }) {
  if (type === 'diamond') {
    return (
      <svg className={`${className} text-purple-900`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 7-10 11L2 10l4-7z" />
      </svg>
    );
  }
  if (type === 'ruby') {
    return (
      <svg className={`${className} text-rose-900`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    );
  }
  if (type === 'emerald') {
    return (
      <svg className={`${className} text-emerald-900`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    );
  }
  if (type === 'platinum') {
    return (
      <svg className={`${className} text-cyan-900`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    );
  }
  if (type === 'gold') {
    return (
      <svg className={`${className} text-amber-900`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18M4 7l4 6 4-6 4 6 4-6v10H4V7z" />
      </svg>
    );
  }
  if (type === 'silver') {
    return (
      <svg className={`${className} text-slate-800`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    );
  }
  if (type === 'bronze') {
    return (
      <svg className={`${className} text-amber-950`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.496m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.496 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    );
  }
  return (
    <svg className={`${className} text-emerald-800`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
    </svg>
  );
}

export default function AccountHero({ user, customer, orders = [], onSelectTab }) {
  const points = customer?.points || 0;
  const storeCredit = customer?.storeCredit || 0;
  const totalOrders = customer?.totalOrders || orders.length || 0;
  const tierPoints = customer?.tierPoints ?? points;
  
  const activeOrders = orders.filter(o => 
    ['PENDING', 'PROCESSING', 'READY'].includes(o.status)
  );

  const tier = getTierInfo(tierPoints, totalOrders);

  const memberSinceYear = customer?.createdAt 
    ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2024';

  const userInitial = (customer?.name || user?.name || 'Customer').charAt(0).toUpperCase();

  return (
    <div className="glass-card p-6 md:p-8 mb-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pc-green/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-pc-gold/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* User Info Header */}
        <div className="flex items-center gap-4 md:gap-5">
          <div className="relative">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={user.image} 
                alt="Profile" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-pc-green/40 shadow-lg shadow-pc-green/10"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-pc-card to-pc-green/20 border-2 border-pc-green/40 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg shadow-pc-green/10">
                {userInitial}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-pc-black border border-pc-border rounded-full p-1.5 shadow">
              <TierIcon type={tier.type} />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {customer?.name || user?.name || 'Welcome Back'}
              </h1>
              <span className={`text-xs font-black tracking-wide px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${tier.badgeClass}`}>
                <TierIcon type={tier.type} />
                <span>{tier.name}</span>
              </span>
            </div>
            <p className="text-sm text-pc-muted flex items-center gap-2">
              <span>{user?.email || customer?.phone || 'Holy Buds Member'}</span>
              <span>•</span>
              <span>Member since {memberSinceYear}</span>
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full lg:w-auto">
          {/* Points */}
          <div 
            onClick={() => onSelectTab('rewards')}
            className="bg-pc-dark/70 hover:bg-pc-dark border border-pc-border hover:border-pc-green/50 rounded-2xl p-4 transition-all cursor-pointer group"
          >
            <p className="text-xs font-semibold text-pc-muted uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Points</span>
              <span className="text-pc-green text-sm group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
            <p className="text-2xl md:text-3xl font-black text-pc-green tracking-tight">
              {points.toLocaleString()}
            </p>
            <p className="text-[11px] text-pc-muted/80 mt-0.5">
              {points >= 500 ? 'Rewards ready' : 'Earn $1 = 1 pt'}
            </p>
          </div>

          {/* Store Credit */}
          <div 
            onClick={() => onSelectTab('rewards')}
            className="bg-pc-dark/70 hover:bg-pc-dark border border-pc-border hover:border-amber-500/50 rounded-2xl p-4 transition-all cursor-pointer group"
          >
            <p className="text-xs font-semibold text-pc-muted uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Store Credit</span>
              <span className="text-amber-400 text-sm group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
            <p className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight">
              ${storeCredit.toFixed(2)}
            </p>
            <p className="text-[11px] text-pc-muted/80 mt-0.5">
              Use at checkout
            </p>
          </div>

          {/* Total Orders */}
          <div 
            onClick={() => onSelectTab('orders')}
            className="bg-pc-dark/70 hover:bg-pc-dark border border-pc-border hover:border-blue-500/50 rounded-2xl p-4 transition-all cursor-pointer group"
          >
            <p className="text-xs font-semibold text-pc-muted uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Orders</span>
              <span className="text-blue-400 text-sm group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
            <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {totalOrders}
            </p>
            <p className="text-[11px] text-pc-muted/80 mt-0.5">
              Lifetime history
            </p>
          </div>

          {/* Active Orders */}
          <div 
            onClick={() => onSelectTab('orders')}
            className={`bg-pc-dark/70 hover:bg-pc-dark border rounded-2xl p-4 transition-all cursor-pointer group ${
              activeOrders.length > 0 
                ? 'border-pc-green/50 bg-pc-green/5 ring-1 ring-pc-green/20' 
                : 'border-pc-border'
            }`}
          >
            <p className="text-xs font-semibold text-pc-muted uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Active</span>
              {activeOrders.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-pc-green animate-ping" />
              )}
            </p>
            <p className={`text-2xl md:text-3xl font-black tracking-tight ${activeOrders.length > 0 ? 'text-pc-green' : 'text-pc-muted'}`}>
              {activeOrders.length}
            </p>
            <p className="text-[11px] text-pc-muted/80 mt-0.5">
              {activeOrders.length > 0 ? 'Delivery in progress' : 'No active orders'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
