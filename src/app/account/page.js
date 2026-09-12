'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider, useCart } from '@/components/CartProvider';
import { getFavoriteProducts } from './actions';

import AccountHero from './components/AccountHero';
import ActiveOrderTracker from './components/ActiveOrderTracker';
import OrdersTab from './components/OrdersTab';
import RewardsTab from './components/RewardsTab';
import ProfileTab from './components/ProfileTab';
import FavoritesTab from './components/FavoritesTab';

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'orders');
  const [, startTransition] = useTransition();

  const [customerProfile, setCustomerProfile] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);

  // Phone linking state
  const [phoneInput, setPhoneInput] = useState('');
  const [linkingPhone, setLinkingPhone] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const { addItem, setIsOpen } = useCart();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (tabParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tab);
      window.history.replaceState(null, '', `?${params.toString()}`);
    });
  };

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/account/me');
      if (res.ok) {
        const data = await res.json();
        if (data.customer) {
          setCustomerProfile(data.customer);
          setRecentOrders(data.orders || []);
        }
        if (data.settings) {
          setSiteSettings(data.settings);
        }
      }
    } catch (e) {
      console.error('Failed to refresh user account:', e);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    let ignore = false;

    async function loadUserData() {
      try {
        const res = await fetch('/api/account/me');
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.customer) {
            setCustomerProfile(data.customer);
            setRecentOrders(data.orders || []);
          }
          if (data.settings) {
            setSiteSettings(data.settings);
          }
        }
      } catch (e) {
        console.error('Failed to load user account:', e);
      } finally {
        if (!ignore) {
          setLoadingUserData(false);
        }
      }
    }

    loadUserData();

    return () => {
      ignore = true;
    };
  }, [status]);

  useEffect(() => {
    if (activeTab !== 'favorites') return;
    let ignore = false;

    async function loadFavs() {
      try {
        const favIds = JSON.parse(localStorage.getItem('holybuds_favorites') || '[]');
        if (favIds.length > 0) {
          const products = await getFavoriteProducts(favIds);
          if (!ignore) setFavorites(products || []);
        } else {
          if (!ignore) setFavorites([]);
        }
      } catch {
        if (!ignore) setFavorites([]);
      } finally {
        if (!ignore) setLoadingFavs(false);
      }
    }

    loadFavs();

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const handleClearFavorites = () => {
    if (window.confirm('Clear all saved favorites?')) {
      localStorage.removeItem('holybuds_favorites');
      setFavorites([]);
      showToast('Favorites cleared');
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneInput) return;
    setLinkingPhone(true);

    try {
      const res = await fetch('/api/account/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });

      if (res.ok) {
        await refreshUserData();
        showToast('Phone number linked successfully!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to link phone');
      }
    } catch {
      alert('Network error while linking phone');
    } finally {
      setLinkingPhone(false);
    }
  };

  const handleReorderOrder = (order) => {
    let addedCount = 0;
    (order.items || []).forEach(item => {
      if (item.product && item.product.stock > 0) {
        addItem(item.product);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setIsOpen(true);
      showToast(`Added ${addedCount} available item${addedCount !== 1 ? 's' : ''} to your cart!`);
    } else {
      showToast('Items from this order are currently out of stock.');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loadingUserData && !customerProfile)) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
            <div className="h-44 bg-pc-card/50 rounded-3xl border border-pc-border" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="h-60 bg-pc-card/40 rounded-2xl border border-pc-border hidden md:block" />
              <div className="md:col-span-3 h-96 bg-pc-card/40 rounded-2xl border border-pc-border" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Force phone link if user is not linked to a Customer record yet
  if (!customerProfile && !loadingUserData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
          <div className="max-w-md w-full glass-card p-8 text-center animate-fade-in-up border-pc-green/30 shadow-2xl">
            <div className="w-16 h-16 bg-pc-green/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pc-green border border-pc-green/30 text-3xl">
              📱
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Connect Your Phone</h1>
            <p className="text-xs text-pc-muted mb-6 leading-relaxed">
              Link your mobile phone number to unlock your past orders, delivery tracking, and loyalty reward points.
            </p>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <input
                type="tel"
                required
                placeholder="(555) 555-5555"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                className="w-full bg-pc-black border border-pc-border rounded-xl px-4 py-3 text-white focus:border-pc-green focus:outline-none text-center text-lg font-mono tracking-wider"
              />
              <button
                type="submit"
                disabled={linkingPhone}
                className="w-full btn-primary py-3 font-black text-sm shadow-md shadow-pc-green/20"
              >
                {linkingPhone ? 'Connecting...' : 'Link Phone Number'}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full btn-secondary py-2.5 text-xs font-bold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  const activeOrdersCount = recentOrders.filter(o => 
    ['PENDING', 'PROCESSING', 'READY', 'DELIVERED'].includes(o.status)
  ).length;

  const pointsCount = customerProfile?.points || 0;

  return (
    <>
      <Navbar />
      <CartDrawer />

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-pc-green text-pc-black font-black text-xs px-4 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Bar with Sign Out */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-pc-green">
              Customer Portal
            </span>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-pc-muted hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 bg-pc-dark/60 hover:bg-pc-dark px-3 py-1.5 rounded-xl border border-pc-border"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Hero Stats Card */}
          <AccountHero 
            user={session?.user} 
            customer={customerProfile} 
            orders={recentOrders}
            onSelectTab={handleTabChange}
          />

          {/* Live Order Tracker Banner (If active orders exist) */}
          <ActiveOrderTracker 
            orders={recentOrders} 
            onSelectOrder={() => handleTabChange('orders')}
          />

          {/* Main Content Layout with Responsive Navigation */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Navigation Tabs */}
            <div className="lg:col-span-1 sticky top-24 z-20">
              {/* Mobile Horizontal Scrollable Pills */}
              <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 pb-2 mb-4">
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'orders'
                      ? 'bg-pc-green text-pc-black shadow-lg shadow-pc-green/20'
                      : 'bg-pc-card text-pc-muted hover:text-white border border-pc-border'
                  }`}
                >
                  <span>📦 Orders</span>
                  {activeOrdersCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-pc-green animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('rewards')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'rewards'
                      ? 'bg-pc-green text-pc-black shadow-lg shadow-pc-green/20'
                      : 'bg-pc-card text-pc-muted hover:text-white border border-pc-border'
                  }`}
                >
                  <span>✨ Rewards & Referrals</span>
                  {pointsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-pc-black/20 rounded-md">
                      {pointsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('favorites')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'favorites'
                      ? 'bg-pc-green text-pc-black shadow-lg shadow-pc-green/20'
                      : 'bg-pc-card text-pc-muted hover:text-white border border-pc-border'
                  }`}
                >
                  <span>❤️ Favorites</span>
                </button>

                <button
                  onClick={() => handleTabChange('profile')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'profile'
                      ? 'bg-pc-green text-pc-black shadow-lg shadow-pc-green/20'
                      : 'bg-pc-card text-pc-muted hover:text-white border border-pc-border'
                  }`}
                >
                  <span>👤 Profile</span>
                </button>
              </div>

              {/* Desktop Vertical Tab Menu */}
              <div className="hidden lg:flex flex-col gap-2 glass-card p-3 rounded-2xl border-pc-border/80">
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'orders'
                      ? 'bg-pc-green/15 text-pc-green border border-pc-green/40 shadow-sm'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">📦</span>
                    <span>Order History</span>
                  </span>
                  {activeOrdersCount > 0 && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-pc-green text-pc-black shadow-sm">
                      {activeOrdersCount} live
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange('rewards')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'rewards'
                      ? 'bg-pc-green/15 text-pc-green border border-pc-green/40 shadow-sm'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">✨</span>
                    <span>Rewards & Referrals</span>
                  </span>
                  <span className="text-xs font-bold text-pc-muted">
                    {pointsCount.toLocaleString()} pts
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('favorites')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'favorites'
                      ? 'bg-pc-green/15 text-pc-green border border-pc-green/40 shadow-sm'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">❤️</span>
                    <span>Saved Favorites</span>
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'profile'
                      ? 'bg-pc-green/15 text-pc-green border border-pc-green/40 shadow-sm'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">👤</span>
                    <span>Delivery & Profile</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Contents Area */}
            <div className="lg:col-span-3 min-w-0">
              {activeTab === 'orders' && (
                <OrdersTab 
                  orders={recentOrders} 
                  onReorder={handleReorderOrder} 
                />
              )}

              {activeTab === 'rewards' && (
                <RewardsTab 
                  customer={customerProfile} 
                  settings={siteSettings} 
                />
              )}

              {activeTab === 'favorites' && (
                <FavoritesTab 
                  favorites={favorites} 
                  loading={loadingFavs}
                  onClearFavorites={handleClearFavorites} 
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab 
                  user={session?.user} 
                  customerProfile={customerProfile} 
                  setCustomerProfile={setCustomerProfile} 
                />
              )}
            </div>

          </div>

        </div>
      </main>
    </>
  );
}

export default function AccountPage() {
  return (
    <CartProvider>
      <Suspense fallback={
        <div className="min-h-screen pt-32 text-center text-pc-muted">
          Loading your account...
        </div>
      }>
        <AccountContent />
      </Suspense>
    </CartProvider>
  );
}
