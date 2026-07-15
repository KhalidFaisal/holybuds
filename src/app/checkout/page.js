'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import Navbar from '@/components/Navbar';
import { CartProvider } from '@/components/CartProvider';
import Link from 'next/link';

export const LOYALTY_REWARDS = [
  { id: '500_acc', points: 500, label: "$5 Off Any Accessory", type: "FIXED", category: "accessories", value: 5 },
  { id: '1000_acc', points: 1000, label: "10% Off One Accessory Order", type: "PERCENT", category: "accessories", value: 10 },
  { id: '2000_any', points: 2000, label: "$15 Off Any Order", type: "FIXED", value: 15 },
  { id: '3500_free', points: 3500, label: "Free Cart or Edible", type: "FREE_LOWEST", categories: ["vapes", "edibles"] },
  { id: '5000_any', points: 5000, label: "$35 Off Any Order", type: "FIXED", value: 35 },
  { id: '7500_any', points: 7500, label: "Free Premium Accessory or $50 Off", type: "FREE_LOWEST", categories: ["accessories"], maxValue: 50 },
  { id: '10000_free', points: 10000, label: "Free 1/2", type: "FREE_LOWEST", categories: ["flowers"] }
];

export function calcRewardDiscount(reward, items) {
  if (!reward) return 0;
  
  if (reward.type === 'FIXED') {
    if (reward.category) {
      const hasCat = items.some(i => i.category && i.category.toUpperCase().includes(reward.category.toUpperCase()));
      return hasCat ? reward.value : 0;
    }
    return reward.value;
  }
  
  if (reward.type === 'PERCENT') {
    if (reward.category) {
      const catTotal = items.filter(i => i.category && i.category.toUpperCase().includes(reward.category.toUpperCase()))
                            .reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return catTotal * (reward.value / 100);
    }
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    return total * (reward.value / 100);
  }
  
  if (reward.type === 'FREE_LOWEST') {
    let eligibleItems = items;
    if (reward.categories) {
      eligibleItems = items.filter(i => i.category && reward.categories.some(c => i.category.toUpperCase().includes(c.toUpperCase())));
    }
    if (eligibleItems.length === 0) return 0;
    
    const lowest = eligibleItems.reduce((min, item) => item.price < min.price ? item : min, eligibleItems[0]);
    if (reward.maxValue && lowest.price > reward.maxValue) {
      return reward.maxValue;
    }
    return lowest.price; // Making 1 unit of this free
  }
  
  return 0;
}

function CheckoutContent() {
  const { items, subtotal, total, discountAmount, discountName, clearCart, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryMethod: 'PICKUP',
    deliveryAddress: '',
    town: '',
    zipCode: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderConfirm, setOrderConfirm] = useState(null);

  // Loyalty states
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  // Phone lookup
  useEffect(() => {
    const sanitized = form.customerPhone.replace(/\D/g, '');
    if (sanitized.length >= 10) {
      const fetchLoyalty = async () => {
        setLoyaltyLoading(true);
        try {
          const res = await fetch(`/api/loyalty/lookup?phone=${sanitized}`);
          if (res.ok) {
            const data = await res.json();
            setCustomerProfile(data.customer);
          } else {
            setCustomerProfile(null);
            setSelectedReward(null);
          }
        } catch (e) {
          setCustomerProfile(null);
          setSelectedReward(null);
        } finally {
          setLoyaltyLoading(false);
        }
      };
      
      const timeoutId = setTimeout(fetchLoyalty, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setCustomerProfile(null);
      setSelectedReward(null);
    }
  }, [form.customerPhone]);

  // Sync draft to localStorage so SessionTracker can pick it up
  useEffect(() => {
    localStorage.setItem('holybuds_checkout_draft', JSON.stringify(form));
  }, [form]);

  // If a reward is selected, calculate its discount
  const rewardDiscount = calcRewardDiscount(selectedReward, items);
  
  // To avoid double dipping, if a standard promo code discount exists, we just sum them.
  // Wait, let's just make the final total subtract both.
  const isDelivery = form.deliveryMethod === 'DELIVERY';
  const effectiveTotal = total - rewardDiscount;
  const deliveryFee = isDelivery && effectiveTotal < 100 ? 10 : 0;
  const finalTotal = Math.max(0, effectiveTotal) + deliveryFee;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMethodChange = (method) => {
    setForm((prev) => ({ ...prev, deliveryMethod: method }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deliveryAddress: isDelivery ? `${form.deliveryAddress}, ${form.town}, ${form.zipCode}` : form.town,
          pointsUsed: selectedReward ? selectedReward.points : 0,
          rewardUsed: selectedReward ? selectedReward.label : null,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const order = await res.json();
      
      // Save to recent orders for "Buy Again"
      try {
        const pastOrders = JSON.parse(localStorage.getItem('holybuds_recent_orders') || '[]');
        const fullOrder = {
          ...order,
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            product: item
          }))
        };
        pastOrders.unshift(fullOrder);
        // Keep only last 10 orders
        localStorage.setItem('holybuds_recent_orders', JSON.stringify(pastOrders.slice(0, 10)));
      } catch (e) {
        console.error('Failed to save recent order', e);
      }

      setOrderConfirm(order);
      clearCart();
      localStorage.removeItem('holybuds_checkout_draft');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Order confirmation
  if (orderConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 md:p-12 text-center max-w-lg animate-fade-in-up">
          <div className="w-20 h-20 bg-pc-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Order Placed!</h2>
          <p className="text-pc-muted mb-6">Your order has been received and is being prepared.</p>

          <div className="glass-card p-4 mb-6">
            <p className="text-sm text-pc-muted">Order Number</p>
            <p className="text-2xl font-black text-pc-green">{orderConfirm.orderNumber}</p>
          </div>

          <div className="text-left space-y-2 mb-8 text-sm">
            <div className="flex justify-between text-pc-muted">
              <span>Name</span>
              <span className="text-white">{orderConfirm.customerName}</span>
            </div>
            <div className="flex justify-between text-pc-muted">
              <span>Method</span>
              <span className="text-white">{orderConfirm.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span>
            </div>
            {orderConfirm.deliveryMethod === 'DELIVERY' && (
              <div className="flex justify-between text-pc-muted">
                <span>Address</span>
                <span className="text-white text-right max-w-[200px] break-words">{orderConfirm.deliveryAddress}</span>
              </div>
            )}
            {orderConfirm.deliveryMethod === 'PICKUP' && orderConfirm.deliveryAddress && (
              <div className="flex justify-between text-pc-muted">
                <span>Town</span>
                <span className="text-white text-right max-w-[200px] break-words">{orderConfirm.deliveryAddress}</span>
              </div>
            )}
            <div className="flex justify-between text-pc-muted">
              <span>Total</span>
              <span className="text-white font-bold">${orderConfirm.total.toFixed(2)}</span>
            </div>
          </div>

          <Link href="/menu" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto text-pc-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-pc-muted mb-6">Add some products before checking out</p>
          <Link href="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="section-title mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
              
              {/* Order Method */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Order Method</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleMethodChange('PICKUP')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${!isDelivery ? 'border-pc-green bg-pc-green/10 text-pc-green' : 'border-pc-border bg-pc-dark text-pc-muted hover:border-pc-green/50'}`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
                    <span className="font-semibold">Pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMethodChange('DELIVERY')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isDelivery ? 'border-pc-green bg-pc-green/10 text-pc-green' : 'border-pc-border bg-pc-dark text-pc-muted hover:border-pc-green/50'}`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                    <span className="font-semibold">Delivery</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-2">Customer Details</h2>

                <div>
                  <label className="block text-sm font-medium text-pc-muted mb-1">Full Name *</label>
                  <input name="customerName" value={form.customerName} onChange={handleChange} required className="input-field" placeholder="Your name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pc-muted mb-1">Phone Number *</label>
                  <input name="customerPhone" value={form.customerPhone} onChange={handleChange} required className="input-field" placeholder="(555) 123-4567" type="tel" />
                </div>
                
                {/* LOYALTY DASHBOARD */}
                {loyaltyLoading && (
                  <div className="text-pc-muted text-sm py-2 animate-pulse">Checking loyalty status...</div>
                )}
                {customerProfile && !loyaltyLoading && (
                  <div className="bg-pc-green/10 border border-pc-green/30 rounded-xl p-4 mt-4 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-pc-green text-lg">Welcome back, {customerProfile.name}!</h3>
                        <p className="text-sm text-pc-muted">You have <strong className="text-white">{customerProfile.points} Points</strong></p>
                      </div>
                      <div className="bg-pc-dark/50 px-3 py-1 rounded-full text-xs font-medium text-pc-muted border border-pc-border/50">
                        {customerProfile.totalOrders} Orders
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-pc-muted uppercase tracking-wider mb-2">Available Rewards</p>
                      {LOYALTY_REWARDS.map(reward => {
                        const canAfford = customerProfile.points >= reward.points;
                        const isSelected = selectedReward?.id === reward.id;
                        
                        return (
                          <div 
                            key={reward.id}
                            className={`p-3 rounded-lg border text-sm flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-pc-green/20 border-pc-green text-white' : 
                              canAfford ? 'bg-pc-dark border-pc-border hover:border-pc-green/50 text-white cursor-pointer' : 
                              'bg-pc-dark/50 border-pc-border/30 text-pc-muted/50 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              if (!canAfford) return;
                              setSelectedReward(isSelected ? null : reward);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-pc-green bg-pc-green' : 
                                canAfford ? 'border-pc-muted' : 'border-pc-border/30'
                              }`}>
                                {isSelected && <div className="w-2 h-2 bg-pc-dark rounded-full" />}
                              </div>
                              <div className="flex flex-col">
                                <span className={isSelected ? 'font-bold' : ''}>{reward.label}</span>
                                <span className="text-xs opacity-70">{reward.points} Pts</span>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-pc-green font-bold text-xs bg-pc-dark px-2 py-1 rounded">Selected</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* END LOYALTY DASHBOARD */}

                {isDelivery && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-pc-muted mb-1">Street Address *</label>
                      <input name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange} required className="input-field" placeholder="123 Main St, Apt 4" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-pc-muted mb-1">Town / City *</label>
                        <input name="town" value={form.town} onChange={handleChange} required className="input-field" placeholder="New York" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-pc-muted mb-1">Zip Code *</label>
                        <input name="zipCode" value={form.zipCode} onChange={handleChange} required className="input-field" placeholder="10001" />
                      </div>
                    </div>
                  </div>
                )}

                {!isDelivery && (
                  <div>
                    <label className="block text-sm font-medium text-pc-muted mb-1">What town are you coming from? *</label>
                    <input name="town" value={form.town} onChange={handleChange} required className="input-field" placeholder="e.g. West Side, East Town..." />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-pc-muted mb-1">Notes (optional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="input-field resize-none" placeholder={isDelivery ? "Gate code, delivery instructions..." : "Any special requests..."} />
                </div>
              </div>

              {deliveryFee > 0 && (
                <div className="bg-pc-gold/10 border border-pc-gold/30 text-pc-gold p-4 rounded-xl flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="text-sm">A $10 delivery fee applies to orders under $100. Add ${(100 - total).toFixed(2)} more to your cart for free delivery!</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting} 
                className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed" 
                id="place-order-btn"
              >
                {submitting ? 'Placing Order...' : `Place Order — $${finalTotal.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm border-b border-pc-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      {item.weight && (
                        <p className="text-pc-muted text-xs mb-1">
                          {item.weight}
                        </p>
                      )}
                      {item.eligibleDiscountNames && item.eligibleDiscountNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.eligibleDiscountNames.map(name => (
                            <span key={name} className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/30 truncate max-w-full">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center bg-pc-dark rounded-lg border border-pc-border overflow-hidden h-7">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 h-full hover:bg-white/10 text-pc-muted hover:text-white transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-medium text-white min-w-[24px] text-center text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                            className="px-2.5 h-full hover:bg-white/10 text-pc-muted hover:text-white transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-white font-semibold ml-4 mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-pc-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-pc-muted">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-pc-green">
                    <span>Discount: {discountName}</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {rewardDiscount > 0 && (
                  <div className="flex justify-between text-pc-green">
                    <span>Reward: {selectedReward?.label}</span>
                    <span>-${rewardDiscount.toFixed(2)}</span>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-pc-muted">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-pc-border">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <p className="flex items-center gap-2 text-pc-muted/60 text-xs mt-4">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V4.22c0-.756-.728-1.296-1.453-1.096a59.769 59.769 0 01-15.797 2.101c-.727.198-1.453-.342-1.453-1.096v13.43c0 .756.728 1.296 1.453 1.096z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{isDelivery ? "Pay on delivery. Cash and Zelle accepted." : "Pay at pickup. Cash and Zelle accepted."}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CartProvider>
      <Navbar />
      <CheckoutContent />
    </CartProvider>
  );
}
