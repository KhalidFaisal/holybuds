'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider, useCart } from '@/components/CartProvider';
import ProductCard from '@/components/ProductCard';
import { getFavoriteProducts } from './actions';
import { LOYALTY_REWARDS } from '@/lib/loyalty';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function ProfileTab({ customerProfile, setCustomerProfile }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: customerProfile.name || '',
        phone: customerProfile.phone || '',
        address: customerProfile.address || ''
      });
    }
  }, [customerProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setCustomerProfile(data.customer);
        setEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!customerProfile) return null;

  return (
    <div className="glass-card p-8 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Profile Information</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-pc-green hover:text-white transition-colors">
            Edit
          </button>
        )}
      </div>

      {error && <div className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded">{error}</div>}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-pc-muted mb-1">Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-pc-black border border-pc-border rounded-lg px-4 py-2 text-white focus:border-pc-green focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-pc-muted mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-pc-black border border-pc-border rounded-lg px-4 py-2 text-white focus:border-pc-green focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-pc-muted mb-1">Address</label>
            <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-pc-black border border-pc-border rounded-lg px-4 py-2 text-white focus:border-pc-green focus:outline-none h-24"></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-pc-muted hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-pc-muted">Name</p>
            <p className="text-lg text-white font-medium">{customerProfile.name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-pc-muted flex justify-between items-center">
              Phone
              {customerProfile.phone && (
                <span className={`text-xs px-2 py-1 rounded-full ${customerProfile.phoneVerified ? 'bg-pc-green/20 text-pc-green' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {customerProfile.phoneVerified ? 'Verified' : 'Unverified'}
                </span>
              )}
            </p>
            <p className="text-lg text-white font-medium">{customerProfile.phone || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-pc-muted">Address</p>
            <p className="text-lg text-white font-medium">{customerProfile.address || 'Not set'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  const [recentOrders, setRecentOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  
  const [customerProfile, setCustomerProfile] = useState(null);
  const [pointsPerDollar, setPointsPerDollar] = useState(1);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [linkingPhone, setLinkingPhone] = useState(false);

  const { items: cartItems, addItem, clearCart, setIsOpen } = useCart();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchUserData = async () => {
        setLoadingLoyalty(true);
        try {
          const res = await fetch('/api/account/me');
          if (res.ok) {
            const data = await res.json();
            if (data.customer) {
              setCustomerProfile(data.customer);
              setRecentOrders(data.orders || []);
            }
            if (data.settings?.pointsPerDollar) {
              setPointsPerDollar(data.settings.pointsPerDollar);
            }
          }
        } catch (e) {
        } finally {
          setLoadingLoyalty(false);
        }
      };
      fetchUserData();
    }
  }, [status]);

  const loadFavs = async () => {
    setLoadingFavs(true);
    try {
      const favIds = JSON.parse(localStorage.getItem('holybuds_favorites') || '[]');
      if (favIds.length > 0) {
        const products = await getFavoriteProducts(favIds);
        setFavorites(products);
      } else {
        setFavorites([]);
      }
    } catch (e) {
    } finally {
      setLoadingFavs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'favorites') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadFavs();
    }
  }, [activeTab]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneInput) return;
    setLinkingPhone(true);
    
    try {
      const res = await fetch('/api/account/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      });
      
      if (res.ok) {
        // reload the me endpoint to get the customer details
        const meRes = await fetch('/api/account/me');
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.customer) {
            setCustomerProfile(data.customer);
            setRecentOrders(data.orders || []);
          }
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to link phone');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLinkingPhone(false);
    }
  };

  const handleCopyCode = async (code) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {}
    }
  };

  const reorderEntireOrder = (order) => {
    order.items?.forEach(item => {
      if (item.product && item.product.stock > 0) {
        addItem(item.product);
      }
    });
    setIsOpen(true);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pc-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  // If user hasn't linked a phone number yet, force them to do it.
  if (!customerProfile && !loadingLoyalty) {
    return (
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto glass-card p-8 text-center animate-fade-in-up mt-12">
          <div className="w-16 h-16 bg-pc-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Your Phone</h1>
          <p className="text-pc-muted mb-6">To access your past orders and loyalty points, please link your phone number to your account.</p>
          
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <input
              type="tel"
              required
              placeholder="(555) 555-5555"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              className="w-full bg-pc-dark border border-pc-border rounded-xl px-4 py-3 text-white focus:border-pc-green focus:outline-none text-center text-lg"
            />
            <button
              type="submit"
              disabled={linkingPhone}
              className="w-full btn-primary py-3 font-bold mb-4"
            >
              {linkingPhone ? 'Linking...' : 'Link Phone Number'}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full btn-secondary py-3 font-bold"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <h1 className="text-3xl md:text-5xl font-black text-white">My Account</h1>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-pc-muted hover:text-white transition-colors text-sm font-semibold flex items-center gap-2 bg-pc-dark/50 px-4 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Content */}
          {activeTab === 'profile' && (
            <ProfileTab customerProfile={customerProfile} setCustomerProfile={setCustomerProfile} />
          )}

          {activeTab === 'orders' && (
            <div>
              {recentOrders.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <p className="text-pc-muted mb-4">You have no recent orders saved on this device.</p>
                  <Link href="/menu" className="btn-primary inline-block">Browse Menu</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentOrders.map((order, idx) => (
                    <div key={idx} className="glass-card p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-pc-border pb-4">
                        <div>
                          <p className="text-pc-green font-bold text-lg mb-1">Order #{order.orderNumber}</p>
                          <p className="text-sm text-pc-muted">{formatDate(order.createdAt)} • {order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-white">${order.total.toFixed(2)}</span>
                          <button 
                            onClick={() => reorderEntireOrder(order)}
                            className="btn-primary py-2 px-4 text-sm whitespace-nowrap flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                            Buy Again
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 bg-pc-dark/50 p-4 rounded-xl">
                            <div className="w-16 h-16 bg-pc-smoke rounded-lg overflow-hidden shrink-0">
                              {item.product?.image && (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                </>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white mb-1">{item.product?.name || 'Unknown Item'}</p>
                              <p className="text-xs text-pc-muted">Qty: {item.quantity} • ${item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              {loadingFavs ? (
                <div className="text-center py-12 text-pc-muted">Loading favorites...</div>
              ) : favorites.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <p className="text-pc-muted mb-4">You haven&apos;t saved any favorites yet.</p>
                  <p className="text-sm text-pc-muted/60 mb-6">Click the heart icon on any product to save it here for later.</p>
                  <Link href="/menu" className="btn-primary inline-block">Browse Menu</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {favorites.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              {loadingLoyalty ? (
                <div className="text-center py-12 text-pc-muted">Loading your rewards...</div>
              ) : (
                <div className="space-y-8">
                  {/* Point Balance */}
                  <div className="glass-card p-8 text-center bg-gradient-to-br from-pc-card to-pc-green/10 border-pc-green/30">
                    <h2 className="text-xl font-bold text-white mb-2">Available Points</h2>
                    <div className="text-5xl md:text-6xl font-black text-pc-green mb-4">
                      {customerProfile.points.toLocaleString()}
                    </div>
                    <p className="text-pc-muted font-medium">Earn {pointsPerDollar} point{pointsPerDollar !== 1 ? 's' : ''} for every $1 spent!</p>
                  </div>

                  {/* Referral Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-pc-gold/20 flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-pc-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">Refer a Friend</h3>
                          <p className="text-sm text-pc-muted">Give this code to a friend. When they place their first order, you get 100 points!</p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <label className="block text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">Your Unique Code</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={customerProfile.referralCode || ''} 
                            className="form-input flex-1 font-mono text-lg tracking-wider text-center"
                          />
                          <button 
                            onClick={handleCopyCode}
                            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${copySuccess ? 'bg-pc-green text-pc-dark' : 'bg-pc-smoke text-white hover:bg-pc-smoke/80'}`}
                          >
                            {copySuccess ? (
                              <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="glass-card p-6 flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-white mb-4">Lifetime Stats</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-pc-border pb-3">
                          <span className="text-pc-muted">Total Orders</span>
                          <span className="font-bold text-white text-lg">{customerProfile.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-pc-muted">Member Since</span>
                          <span className="font-bold text-white">Always 💚</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rewards Grid */}
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Unlockable Rewards</h3>
                    <p className="text-pc-muted mb-6">Rewards can be selected and applied to your total during the Checkout process.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {LOYALTY_REWARDS.map(reward => {
                        const isUnlockable = customerProfile.points >= reward.points;
                        return (
                          <div 
                            key={reward.id} 
                            className={`p-5 rounded-xl border transition-all ${
                              isUnlockable 
                                ? 'bg-pc-green/10 border-pc-green/30 hover:border-pc-green/60' 
                                : 'bg-pc-card/50 border-pc-border opacity-70'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                isUnlockable ? 'bg-pc-green text-pc-dark' : 'bg-pc-smoke text-pc-muted'
                              }`}>
                                {reward.points} Pts
                              </span>
                              {isUnlockable && (
                                <svg className="w-5 h-5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                              )}
                            </div>
                            <h4 className={`font-bold text-lg mt-3 ${isUnlockable ? 'text-white' : 'text-pc-muted'}`}>
                              {reward.label}
                            </h4>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default function AccountPage() {
  return (
    <CartProvider>
      <Suspense fallback={<div className="min-h-screen pt-24 text-center text-white">Loading...</div>}>
        <AccountContent />
      </Suspense>
    </CartProvider>
  );
}
