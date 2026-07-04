'use client';

import { useState, useEffect } from 'react';
import { useCart } from './CartProvider';
import Link from 'next/link';
import Image from 'next/image';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, discountAmount, discountName, total, addItem } = useCart();
  const [upscales, setUpscales] = useState([]);

  const cartItemIds = items.map(i => i.id);
  const cartIdsString = cartItemIds.join(',');

  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    fetch('/api/cart/upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: items })
    })
      .then(res => res.json())
      .then(data => {
        if (data.recommendation) {
          setUpscales([data.recommendation]);
        }
      })
      .catch(console.error);
  }, [isOpen, cartIdsString]);

  if (!isOpen) return null;

  const recommended = upscales.filter(u => !cartItemIds.includes(u.id)).slice(0, 3);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-pc-dark border-l border-pc-border z-[70] animate-slide-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pc-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Your Cart
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-pc-muted hover:text-white transition-colors rounded-lg hover:bg-pc-card"
            id="close-cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free Delivery Upscale */}
        {items.length > 0 && (
          <div className="bg-pc-card/50 p-4 border-b border-pc-border">
            {(() => {
              const amountAway = Math.max(0, 100 - total);
              const progressPercent = Math.min(100, (total / 100) * 100);
              return (
                <>
                  <p className="text-sm text-center mb-2 font-medium">
                    {amountAway > 0 ? (
                      <>You're <span className="text-pc-gold font-bold">${amountAway.toFixed(2)}</span> away from free delivery!</>
                    ) : (
                      <span className="text-pc-green font-bold flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        You've unlocked free delivery!
                      </span>
                    )}
                  </p>
                  <div className="w-full bg-pc-smoke rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${amountAway > 0 ? 'bg-pc-gold' : 'bg-pc-green'}`} 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-pc-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <p className="text-pc-muted font-medium">Your cart is empty</p>
              <p className="text-pc-muted/60 text-sm mt-1">Browse our menu to add products</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="glass-card p-4 flex gap-4 animate-fade-in">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-pc-smoke flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-pc-border" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
                    <p className="text-pc-muted text-xs mb-1">{item.weight}</p>
                    {item.eligibleDiscountNames && item.eligibleDiscountNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {item.eligibleDiscountNames.map(name => (
                          <span key={name} className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/30 truncate max-w-full">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-pc-green font-bold mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-pc-muted hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 bg-pc-smoke rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-pc-muted hover:text-white transition-colors text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="text-white font-semibold text-sm min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-pc-muted hover:text-white transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upscales / Recommended */}
          {items.length > 0 && recommended.length > 0 && (
            <div className="mt-8 border-t border-pc-border pt-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-pc-green">✨</span> AI Recommends
              </h3>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar -mx-6 px-6">
                {recommended.map(product => (
                  <div key={product.id} className="w-[140px] shrink-0 snap-start bg-pc-card rounded-xl border border-pc-border overflow-hidden flex flex-col">
                    <div className="aspect-square bg-pc-smoke relative">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="140px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-pc-border" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-xs font-bold text-white truncate mb-1">{product.name}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <p className="text-pc-green text-sm font-bold">${product.calculatedDiscountPrice || product.price}</p>
                        <button 
                          onClick={() => addItem(product)}
                          className="bg-pc-dark hover:bg-pc-border text-white text-xs px-2 py-1 rounded transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Totals */}
        {items.length > 0 && (
          <div className="border-t border-pc-border p-6 space-y-4">
            <div className="space-y-2 text-sm">
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
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-pc-border">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="btn-primary block text-center w-full text-lg"
              id="checkout-button"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
