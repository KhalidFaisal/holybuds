'use client';

function getTierInfo(points = 0, totalOrders = 0) {
  if (points >= 2500 || totalOrders >= 15) {
    return { name: 'Diamond VIP', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: '💎' };
  }
  if (points >= 1000 || totalOrders >= 8) {
    return { name: 'Gold Reserve', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: '👑' };
  }
  if (points >= 250 || totalOrders >= 3) {
    return { name: 'Silver Connoisseur', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: '✨' };
  }
  return { name: 'Green Member', badgeClass: 'bg-pc-green/20 text-pc-green border-pc-green/30', icon: '🌿' };
}

export default function AccountHero({ user, customer, orders = [], onSelectTab }) {
  const points = customer?.points || 0;
  const storeCredit = customer?.storeCredit || 0;
  const totalOrders = customer?.totalOrders || orders.length || 0;
  
  const activeOrders = orders.filter(o => 
    ['PENDING', 'PROCESSING', 'READY'].includes(o.status)
  );

  const tier = getTierInfo(points, totalOrders);

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
            <div className="absolute -bottom-1 -right-1 bg-pc-black border border-pc-border rounded-full p-1 text-sm shadow">
              {tier.icon}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {customer?.name || user?.name || 'Welcome Back'}
              </h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                {tier.name}
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
