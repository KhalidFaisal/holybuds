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
import SettingsTab from './components/SettingsTab';

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'orders');
  const [, startTransition] = useTransition();

  const [accountUser, setAccountUser] = useState(null);
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
        if (data.user) {
          setAccountUser(data.user);
        }
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
          if (data.user) {
            setAccountUser(data.user);
          }
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
            <div className="w-16 h-16 bg-pc-green/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pc-green border border-pc-green/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
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
            user={accountUser || session?.user} 
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
              {/* Mobile 5-Column Segmented Tab Bar */}
              <div className="grid lg:hidden grid-cols-5 gap-1 p-1 bg-pc-card/90 backdrop-blur-md rounded-2xl border border-pc-border mb-6 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleTabChange('orders')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
                    activeTab === 'orders'
                      ? 'bg-pc-green text-pc-black shadow-md shadow-pc-green/20'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                  <span className="text-[11px] font-black tracking-tight leading-none truncate w-full text-center">Orders</span>
                  {activeOrdersCount > 0 && (
                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-ping ${activeTab === 'orders' ? 'bg-pc-black' : 'bg-pc-green'}`} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('rewards')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'rewards'
                      ? 'bg-pc-green text-pc-black shadow-md shadow-pc-green/20'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0 3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                  <span className="text-[11px] font-black tracking-tight leading-none truncate w-full text-center">Rewards</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('favorites')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'favorites'
                      ? 'bg-pc-green text-pc-black shadow-md shadow-pc-green/20'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  <span className="text-[11px] font-black tracking-tight leading-none truncate w-full text-center">Favorites</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('profile')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'bg-pc-green text-pc-black shadow-md shadow-pc-green/20'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span className="text-[11px] font-black tracking-tight leading-none truncate w-full text-center">Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('settings')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'settings'
                      ? 'bg-pc-green text-pc-black shadow-md shadow-pc-green/20'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span className="text-[11px] font-black tracking-tight leading-none truncate w-full text-center">Settings</span>
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0 3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                    </svg>
                    <span>Rewards & Referrals</span>
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span>Delivery & Profile</span>
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('settings')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'settings'
                      ? 'bg-pc-green/15 text-pc-green border border-pc-green/40 shadow-sm'
                      : 'text-pc-muted hover:text-white hover:bg-pc-dark/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span>Account Settings</span>
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
                  user={accountUser || session?.user} 
                  customerProfile={customerProfile} 
                  setCustomerProfile={setCustomerProfile} 
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab 
                  user={accountUser || session?.user} 
                  customerProfile={customerProfile} 
                  onRefreshUser={refreshUserData} 
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
